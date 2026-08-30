const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.Mixed, // Allows both ObjectId and UUID strings for mock mode
            ref: 'User',
            required: true,
            index: true,
        },

        // File Information
        fileName: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            enum: ['pdf', 'image'],
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
        },

        // Document Metadata
        documentType: {
            type: String,
            enum: ['lab-report', 'prescription', 'discharge-summary', 'imaging', 'consultation', 'other'],
            default: 'other',
        },
        uploadDate: {
            type: Date,
            default: Date.now,
        },

        // OCR Extracted Text
        extractedText: {
            type: String,
        },

        // AI Analysis Results
        aiProcessed: {
            type: Boolean,
            default: false,
        },
        aiAnalysis: {
            // Medical Information Extracted
            diagnoses: [String],
            medications: [
                {
                    name: String,
                    dosage: String,
                    frequency: String,
                },
            ],
            allergies: [String],
            surgeries: [
                {
                    procedure: String,
                    date: Date,
                },
            ],
            chronicConditions: [String],

            // AI-Generated Summaries
            emergencySummary: String, // Critical info for emergency responders
            doctorSummary: String, // Clinical summary for doctors
            patientExplanation: String, // Patient-friendly explanation

            // Risk Assessment
            riskLevel: {
                type: String,
                enum: ['GREEN', 'YELLOW', 'RED'],
                default: 'GREEN',
            },
            riskFactors: [String],
            drugInteractions: [String],
        },

        // Processing Status
        processingStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        processingError: {
            type: String,
        },

        // Uploaded By (for hospital records)
        uploadedBy: {
            type: String, // Could be 'patient' or doctor name
            default: 'patient',
        },

        // RAG index — semantic chunks + embedding vectors for this record,
        // used by ragService.js for cross-record Q&A / drug-interaction retrieval.
        // Populated after AI analysis completes; safe to leave empty for old records.
        ragChunks: [
            {
                text: String, // human-readable chunk (e.g. "Medications: ...")
                section: String, // 'medications' | 'diagnoses' | 'allergies' | 'summary' | 'raw-text'
                embedding: [Number],
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
medicalRecordSchema.index({ userId: 1, uploadDate: -1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord;
