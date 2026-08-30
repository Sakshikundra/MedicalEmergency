const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.Mixed, // Allows both ObjectId and UUID strings
            ref: 'User',
            required: true,
            index: true,
        },

        // Access Details
        accessType: {
            type: String,
            enum: ['emergency-view', 'full-access', 'qr-scan', 'hospital-upload'],
            required: true,
        },

        accessedBy: {
            name: String,
            role: String, // 'doctor', 'emergency-responder', etc.
            institution: String,
        },

        // Consent Information
        consentGiven: {
            type: Boolean,
            default: false,
        },
        otpVerified: {
            type: Boolean,
            default: false,
        },

        // Technical Details
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },

        // Location (for emergency access)
        location: {
            latitude: Number,
            longitude: Number,
        },

        // Additional Context
        reason: {
            type: String,
        },
        recordsAccessed: [{
            type: mongoose.Schema.Types.Mixed,
            ref: 'MedicalRecord',
        }],

        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: false, // Using custom timestamp field
    }
);

// Index for efficient queries
accessLogSchema.index({ userId: 1, timestamp: -1 });

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

module.exports = AccessLog;
