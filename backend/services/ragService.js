/**
 * RAG (Retrieval-Augmented Generation) service.
 *
 * Purpose: everything in llmService.js analyzes ONE uploaded document in
 * isolation. This service adds cross-record context — it lets us answer
 * questions ("what medications is this patient on, across all records?")
 * and check drug interactions against a patient's *entire* history instead
 * of just the document that was just uploaded.
 *
 * Storage: embeddings are stored directly on each MedicalRecord document
 * (`ragChunks: [{ text, section, embedding }]`) instead of a separate vector
 * DB (Pinecone/Atlas Vector Search/etc). This keeps the feature working
 * identically in both mock-DB demo mode and real MongoDB — no extra infra —
 * at the cost of doing similarity search in JS rather than in the database.
 * That's the right tradeoff at this app's scale (a handful of records per
 * patient); if this ever needs to scale to hundreds of records per patient,
 * swap retrieveRelevantChunks() for a real vector index and keep everything
 * else the same.
 *
 * Patient isolation: every retrieval function takes a userId and only ever
 * reads that one patient's records. There is no cross-patient search path
 * in this file — callers must not add one.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const MedicalRecord = require('../models/MedicalRecord');
const { mockMedicalRecord } = require('../utils/mockDb');
const { getDBStatus } = require('../config/db');

// Same "real DB or mock DB" resolution pattern used throughout routes/*.js
const getModel = () => (getDBStatus() ? MedicalRecord : mockMedicalRecord);

const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
const isPlaceholder = !apiKey ||
    apiKey.toLowerCase().includes('your_gemini_key') ||
    apiKey.toLowerCase().includes('your_api_key') ||
    apiKey.toLowerCase().includes('your_gemini_api_key'); // matches .env.example's actual placeholder

let genAI;
if (!isPlaceholder) {
    genAI = new GoogleGenerativeAI(apiKey);
}

const EMBEDDING_DIM = 64; // dimension used by the mock embedding fallback

/**
 * Deterministic "mock" embedding for when no Gemini API key is configured —
 * mirrors the pattern llmService.js already uses for getMockAnalysis().
 * NOT semantically meaningful like a real embedding; it's a hashed
 * bag-of-words vector, so identical/overlapping vocabulary between the
 * query and a chunk will still score higher, which is enough to prove the
 * retrieval pipeline end-to-end without a real API key.
 */
const mockEmbed = (text) => {
    const vec = new Array(EMBEDDING_DIM).fill(0);
    const words = (text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
    for (const word of words) {
        let hash = 0;
        for (let i = 0; i < word.length; i++) {
            hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
        }
        vec[hash % EMBEDDING_DIM] += 1;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
};

/**
 * Embed a piece of text. Uses Gemini's current embedding model
 * (gemini-embedding-001 — text-embedding-004 was deprecated Jan 14 2026,
 * don't revert to it) when an API key is configured, otherwise falls back
 * to the deterministic mock above.
 */
const embedText = async (text) => {
    if (!text || !text.trim()) return null;

    if (!genAI) {
        return mockEmbed(text);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
        const result = await model.embedContent(text.slice(0, 8000)); // stay under the model's input limit
        return result.embedding.values;
    } catch (error) {
        console.warn('⚠️ Gemini embedding failed, falling back to mock embedding:', error.message);
        return mockEmbed(text);
    }
};

const cosineSimilarity = (a, b) => {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Break one analyzed record into a handful of semantic chunks. Keeping
 * chunks section-scoped (rather than one giant blob) makes retrieval more
 * precise — a question about medications matches the medications chunk,
 * not a diagnosis chunk that happens to share some words.
 */
const chunkRecord = (record) => {
    const a = record.aiAnalysis || {};
    const dateStr = record.uploadDate ? new Date(record.uploadDate).toLocaleDateString() : 'unknown date';
    const chunks = [];

    if (a.diagnoses?.length || a.chronicConditions?.length) {
        chunks.push({
            section: 'diagnoses',
            text: `[${record.documentType}, ${dateStr}] Diagnoses: ${(a.diagnoses || []).join(', ') || 'none'}. Chronic conditions: ${(a.chronicConditions || []).join(', ') || 'none'}. Risk level: ${a.riskLevel || 'unknown'}.`,
        });
    }

    if (a.medications?.length) {
        const medsText = a.medications
            .map((m) => (typeof m === 'string' ? m : `${m.name} ${m.dosage || ''} ${m.frequency || ''}`.trim()))
            .join('; ');
        chunks.push({
            section: 'medications',
            text: `[${record.documentType}, ${dateStr}] Medications: ${medsText}. Known drug interactions noted at the time: ${(a.drugInteractions || []).join(', ') || 'none noted'}.`,
        });
    }

    if (a.allergies?.length) {
        chunks.push({
            section: 'allergies',
            text: `[${record.documentType}, ${dateStr}] Allergies: ${a.allergies.join(', ')}.`,
        });
    }

    if (a.doctorSummary || a.emergencySummary) {
        chunks.push({
            section: 'summary',
            text: `[${record.documentType}, ${dateStr}] Summary: ${a.doctorSummary || a.emergencySummary}`,
        });
    }

    if (record.extractedText && record.extractedText.trim()) {
        chunks.push({
            section: 'raw-text',
            text: `[${record.documentType}, ${dateStr}] Extracted text: ${record.extractedText.slice(0, 1500)}`,
        });
    }

    return chunks;
};

/**
 * Index one record: chunk it, embed each chunk, and save the chunks (with
 * their embeddings) back onto the record. Call this after AI analysis
 * completes in the upload flow — safe to call again later (e.g. a
 * re-processing job) since it just overwrites ragChunks.
 */
const indexRecord = async (record) => {
    try {
        const chunks = chunkRecord(record);
        if (chunks.length === 0) return [];

        const embedded = [];
        for (const chunk of chunks) {
            const embedding = await embedText(chunk.text);
            if (embedding) {
                embedded.push({ ...chunk, embedding });
            }
        }

        record.ragChunks = embedded;
        await record.save();
        return embedded;
    } catch (error) {
        // Indexing failure should never block the upload flow itself.
        console.error('RAG indexing failed for record', record._id, ':', error.message);
        return [];
    }
};

/**
 * Retrieve the top-k most relevant chunks for a question, scoped to a single
 * patient's records only. This is the enforcement point for patient
 * isolation — always query by userId, never accept a caller-supplied filter
 * that could widen it.
 */
const retrieveRelevantChunks = async (userId, question, topK = 5) => {
    const queryEmbedding = await embedText(question);
    if (!queryEmbedding) return [];

    const records = await getModel().find({ userId });
    const scored = [];

    for (const record of records) {
        for (const chunk of record.ragChunks || []) {
            if (!chunk.embedding) continue;
            scored.push({
                score: cosineSimilarity(queryEmbedding, chunk.embedding),
                text: chunk.text,
                section: chunk.section,
                recordId: record._id,
                fileName: record.fileName,
                documentType: record.documentType,
                uploadDate: record.uploadDate,
            });
        }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).filter((c) => c.score > 0);
};

/**
 * Full RAG answer: retrieve relevant chunks for this patient, then ask
 * Gemini to answer strictly from that context. Explicitly instructed to
 * say so when the context doesn't contain the answer — in a medical app,
 * a confident wrong answer is worse than an honest "not found".
 */
const answerFromRecords = async (userId, question) => {
    const chunks = await retrieveRelevantChunks(userId, question);

    if (chunks.length === 0) {
        return {
            answer: "I couldn't find anything in this patient's records relevant to that question.",
            sources: [],
        };
    }

    const context = chunks.map((c, i) => `(${i + 1}) ${c.text}`).join('\n');

    if (!genAI) {
        // No API key — return the raw retrieved context instead of a generated
        // answer, same "graceful degrade" pattern llmService.js uses elsewhere.
        return {
            answer: `(Demo mode — no Gemini API key configured, showing retrieved context instead of a generated answer)\n\n${context}`,
            sources: chunks.map((c) => ({ fileName: c.fileName, documentType: c.documentType, uploadDate: c.uploadDate })),
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const prompt = `You are a medical records assistant. Answer the question using ONLY the context below, which comes from this patient's own medical records. If the context does not contain the answer, say clearly that it's not found in the available records — do not guess or use outside knowledge.

Context:
${context}

Question: ${question}

Answer concisely.`;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        return {
            answer,
            sources: chunks.map((c) => ({ fileName: c.fileName, documentType: c.documentType, uploadDate: c.uploadDate })),
        };
    } catch (error) {
        console.error('RAG answer generation failed:', error.message);
        return {
            answer: `Couldn't generate an answer right now, but here's the relevant context found in the records:\n\n${context}`,
            sources: chunks.map((c) => ({ fileName: c.fileName, documentType: c.documentType, uploadDate: c.uploadDate })),
        };
    }
};

/**
 * Cross-record drug interaction check: given the medications on a
 * newly-uploaded record, retrieve medication history from the patient's
 * OTHER records and ask Gemini to check for interactions across all of
 * them together — not just within the single new document.
 */
const checkCrossRecordInteractions = async (userId, newRecordId, newMedications) => {
    if (!newMedications || newMedications.length === 0) return [];

    const medsText = newMedications
        .map((m) => (typeof m === 'string' ? m : `${m.name} ${m.dosage || ''}`.trim()))
        .join(', ');

    const records = await getModel().find({ userId });
    const pastMedChunks = [];
    for (const record of records) {
        if (record._id?.toString() === newRecordId?.toString()) continue; // skip the record we're checking
        for (const chunk of record.ragChunks || []) {
            if (chunk.section === 'medications') pastMedChunks.push(chunk.text);
        }
    }

    if (pastMedChunks.length === 0) return []; // no history to cross-check against

    if (!genAI) {
        return ['(Demo mode: cross-record interaction check needs a Gemini API key to run.)'];
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const prompt = `A patient was just prescribed: ${medsText}.

Their medication history from other records:
${pastMedChunks.join('\n')}

List any potentially significant drug interactions between the new medication(s) and the historical ones, as a JSON array of short strings. If none, return []. Return ONLY the JSON array, nothing else.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('⚠️ Cross-record interaction check failed:', error.message);
        return [];
    }
};

module.exports = {
    embedText,
    cosineSimilarity,
    chunkRecord,
    indexRecord,
    retrieveRelevantChunks,
    answerFromRecords,
    checkCrossRecordInteractions,
};
