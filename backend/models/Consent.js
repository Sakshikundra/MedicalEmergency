const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.Mixed, // Allows both ObjectId and UUID strings
            ref: 'User',
            required: true,
            index: true,
        },

        // Requester Information
        requester: {
            name: String,
            institution: String,
            purpose: String,
        },

        // OTP Details
        otp: {
            type: String,
            required: true,
            select: false, // Don't return OTP by default
        },
        otpExpiry: {
            type: Date,
            required: true,
            index: true,
        },

        // Consent Status
        status: {
            type: String,
            enum: ['pending', 'approved', 'denied', 'expired'],
            default: 'pending',
        },

        // Phone number where OTP was sent
        phoneNumber: {
            type: String,
            required: true,
        },

        // Verification attempts
        verificationAttempts: {
            type: Number,
            default: 0,
        },

        // When consent was granted
        grantedAt: {
            type: Date,
        },

        // Access duration (in minutes)
        accessDuration: {
            type: Number,
            default: 60, // 1 hour by default
        },

        // Access expiry
        accessExpiry: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for cleanup of expired consents
consentSchema.index({ otpExpiry: 1 }, { expireAfterSeconds: 0 });

// Method to check if OTP is valid
consentSchema.methods.isOtpValid = function () {
    return this.otpExpiry > new Date() && this.verificationAttempts < 3;
};

// Method to check if access is still valid
consentSchema.methods.isAccessValid = function () {
    return this.status === 'approved' && this.accessExpiry > new Date();
};

const Consent = mongoose.model('Consent', consentSchema);

module.exports = Consent;
