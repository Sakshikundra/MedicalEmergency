const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadToCloud } = require('../config/cloudStorage');
const { performOCR } = require('../services/ocrService');
const { analyzeMedicalDocument, analyzeMedicalFile } = require('../services/llmService');
const { assessRiskLevel } = require('../utils/riskAssessment');
const { getDBStatus } = require('../config/db');
const { mockMedicalRecord } = require('../utils/mockDb');
const { indexRecord, checkCrossRecordInteractions, answerFromRecords } = require('../services/ragService');

// Use Real or Mock Model
const getModel = () => getDBStatus() ? MedicalRecord : mockMedicalRecord;

/**
 * @route   POST /api/records/upload
 * @desc    Upload medical document with AI processing
 * @access  Private
 */
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        console.log('📬 Upload request received for:', req.file?.originalname);

        if (!req.file) {
            console.log('❌ No file in request');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        const { documentType } = req.body;

        // Determine file type
        const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'image';
        console.log('📎 File type:', fileType, 'MIME:', req.file.mimetype);

        // Upload to cloud storage
        console.log('☁️ Uploading to cloud storage...');
        let uploadResult;
        try {
            uploadResult = await uploadToCloud(
                req.file.buffer,
                `medical-records/${req.user.pulseId}`,
                'auto' // Using auto is safer for both PDF and images
            );
            console.log('✅ Cloudinary upload successful:', uploadResult.public_id);
        } catch (cloudErr) {
            console.error('❌ Cloudinary upload failed:', cloudErr);
            throw new Error(`Storage upload failed: ${cloudErr.message || 'Unknown error'}`);
        }

        // Create medical record entry
        console.log('💾 Saving record to database...');
        const medicalRecord = await getModel().create({
            userId: req.user._id,
            fileName: req.file.originalname,
            fileUrl: uploadResult.secure_url,
            fileType,
            cloudinaryPublicId: uploadResult.public_id,
            documentType: documentType || 'other',
            processingStatus: 'processing',
            uploadedBy: 'patient',
            uploadDate: new Date(),
        });

        console.log('✅ Record saved with ID:', medicalRecord._id);

        // Start AI processing in background
        console.log('🤖 Triggering background AI processing...');
        processDocumentAI(medicalRecord._id, req.file.buffer, req.file.mimetype)
            .catch(err => {
                console.error('❌ Background AI processing error:', err.message);
                // We don't throw here as the main response is already sent
            });

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully. AI processing started.',
            data: medicalRecord,
        });
    } catch (error) {
        console.error('❌ Upload route error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'File upload failed',
        });
    }
});


/**
 * Background AI processing function
 */
async function processDocumentAI(recordId, fileBuffer, mimeType) {
    let record;

    // Hard timeout - processing must complete within 30 seconds
    const timeout = setTimeout(() => {
        console.error(`⏰ TIMEOUT: AI processing exceeded 30 seconds for record ${recordId}`);
        // Optionally, update record status to 'timed_out' here if record is available
        // This part is tricky because `record` might not be defined yet or might be in a weird state.
        // The main catch block will handle errors, but a timeout might not throw an error immediately.
        // For now, just log.
    }, 30000);

    try {
        record = await getModel().findById(recordId);
        if (!record) {
            clearTimeout(timeout);
            console.error('❌ Record not found for processing:', recordId);
            return;
        }

        console.log(`🤖 Starting AI processing for Record: ${recordId} (${mimeType})`);
        const startTime = Date.now();

        let aiAnalysis = null;
        let extractedText = '';

        // Step 1: Use Gemini Multimodal
        try {
            console.log(`📡 Calling Gemini 1.5 Flash for ${mimeType}...`);
            aiAnalysis = await analyzeMedicalFile(fileBuffer, mimeType, record.fileName);
            extractedText = aiAnalysis?.fullExtractedText || 'Text extracted by AI';
            console.log(`✅ Gemini analysis completed in ${Date.now() - startTime}ms`);
        } catch (error) {
            console.error('⚠️ Gemini Multimodal failed:', error.message);

            // Fallback to legacy OCR -> LLM pipeline
            try {
                const ocrType = mimeType.includes('pdf') ? 'pdf' : 'image';
                console.log(`🔄 Falling back to Tesseract OCR (${ocrType})...`);
                extractedText = await performOCR(fileBuffer, ocrType);

                console.log('📡 Calling Gemini for text analysis...');
                aiAnalysis = await analyzeMedicalDocument(extractedText, record.fileName);
                console.log(`✅ Fallback analysis completed in ${Date.now() - startTime}ms`);
            } catch (fallbackError) {
                console.error('❌ Fallback pipeline also failed:', fallbackError.message);
                throw fallbackError;
            }
        }

        if (!aiAnalysis) {
            throw new Error('AI analysis returned no data');
        }

        record.extractedText = extractedText;

        // Step 3: Risk assessment
        console.log('⚠️ Running Risk Assessment...');
        const riskAssessment = assessRiskLevel(aiAnalysis || {});

        // Update record with AI results
        record.aiAnalysis = {
            diagnoses: aiAnalysis.diagnoses || [],
            medications: aiAnalysis.medications || [],
            allergies: aiAnalysis.allergies || [],
            surgeries: aiAnalysis.surgeries || [],
            chronicConditions: aiAnalysis.chronicConditions || [],
            emergencySummary: aiAnalysis.emergencySummary || 'Unable to extract emergency summary',
            doctorSummary: aiAnalysis.doctorSummary || 'Unable to extract doctor summary',
            patientExplanation: aiAnalysis.patientExplanation || 'Unable to extract patient explanation',
            riskLevel: riskAssessment.level,
            riskFactors: riskAssessment.factors,
            drugInteractions: aiAnalysis.drugInteractions || []
        };

        record.aiProcessed = true;
        record.processingStatus = 'completed';
        await record.save();

        clearTimeout(timeout);
        const totalTime = Date.now() - startTime;
        console.log(`✅ AI processing successfully completed for record: ${recordId} in ${totalTime}ms`);

        // Step 4: RAG indexing (chunk + embed this record for cross-record Q&A),
        // then cross-check the new medications against the patient's OTHER
        // records — this is real cross-document interaction checking, unlike
        // the single-document drugInteractions field above. Both are
        // best-effort: a failure here must not undo the completed record.
        try {
            console.log('🔎 Indexing record for RAG...');
            await indexRecord(record);

            if (record.aiAnalysis?.medications?.length > 0) {
                console.log('💊 Checking cross-record drug interactions...');
                const crossInteractions = await checkCrossRecordInteractions(
                    record.userId,
                    record._id,
                    record.aiAnalysis.medications
                );
                if (crossInteractions.length > 0) {
                    record.aiAnalysis.drugInteractions = [
                        ...(record.aiAnalysis.drugInteractions || []),
                        ...crossInteractions.map((i) => `[cross-record] ${i}`),
                    ];
                    await record.save();
                    console.log(`⚠️ Found ${crossInteractions.length} cross-record interaction(s)`);
                }
            }
        } catch (ragError) {
            // Non-fatal — the record itself already processed successfully above.
            console.warn('⚠️ RAG indexing/cross-check failed (non-fatal):', ragError.message);
        }
    } catch (error) {
        clearTimeout(timeout);
        console.error('❌ Fatal AI processing error:', error.message);
        console.error('Stack:', error.stack);

        // Try to update the record status to 'failed' so the user knows
        try {
            if (record || (record = await getModel().findById(recordId))) {
                record.processingStatus = 'failed';
                record.processingError = error.message;
                await record.save();
                console.log('📉 Record status updated to FAILED');
            }
        } catch (saveError) {
            console.error('Couldn\'t save failure status to DB:', saveError.message);
        }
    }
}



/**
 * @route   GET /api/records
 * @desc    Get all medical records for current user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        const records = await getModel().find({ userId: req.user._id })
            .sort({ uploadDate: -1 });

        res.json({
            success: true,
            count: records.length,
            data: records,
        });
    } catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch records',
        });
    }
});

/**
 * @route   GET /api/records/:id
 * @desc    Get specific medical record
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const record = await getModel().findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found',
            });
        }

        res.json({
            success: true,
            data: record,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch record',
        });
    }
});

/**
 * @route   DELETE /api/records/:id
 * @desc    Delete medical record
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const record = await getModel().findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found',
            });
        }

        // Delete from cloud storage
        if (record.cloudinaryPublicId) {
            const { deleteFromCloud } = require('../config/cloudStorage');
            await deleteFromCloud(record.cloudinaryPublicId);
        }

        await record.deleteOne();

        res.json({
            success: true,
            message: 'Record deleted successfully',
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete record',
        });
    }
});

/**
 * @route   GET /api/records/timeline
 * @desc    Get medical history timeline
 * @access  Private
 */
router.get('/user/timeline', protect, async (req, res) => {
    try {
        const records = await getModel().find({
            userId: req.user._id,
            aiProcessed: true,
        }).sort({ uploadDate: -1 });

        // Build timeline
        const timeline = records.map(record => ({
            id: record._id,
            date: record.uploadDate,
            type: record.documentType,
            fileName: record.fileName,
            summary: record.aiAnalysis?.doctorSummary || 'Processing...',
            riskLevel: record.aiAnalysis?.riskLevel || 'GREEN',
        }));

        res.json({
            success: true,
            data: timeline,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch timeline',
        });
    }
});

/**
 * @route   POST /api/records/ask
 * @desc    Ask a natural-language question across all of the current user's
 *          medical records (RAG — retrieval scoped strictly to req.user._id)
 * @access  Private
 */
router.post('/ask', protect, async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Question is required',
            });
        }

        const result = await answerFromRecords(req.user._id, question.trim());

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('RAG ask error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to answer question',
        });
    }
});

module.exports = router;
