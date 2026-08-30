const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const Consent = require('../models/Consent');
const AccessLog = require('../models/AccessLog');
const { getDBStatus } = require('../config/db');
const { mockUser, mockMedicalRecord, mockConsent, mockAccessLog } = require('../utils/mockDb');
const { sendOTP, generateOTP } = require('../services/smsService');
const { upload } = require('../middleware/upload');
const { uploadToCloud } = require('../config/cloudStorage');
const { answerFromRecords } = require('../services/ragService');

// Helpers for model selection
const getUserModel = () => getDBStatus() ? User : mockUser;
const getMedicalRecordModel = () => getDBStatus() ? MedicalRecord : mockMedicalRecord;
const getConsentModel = () => getDBStatus() ? Consent : mockConsent;
const getAccessLogModel = () => getDBStatus() ? AccessLog : mockAccessLog;


/**
 * @route   GET /api/hospital/scan/:pulseId
 * @desc    Emergency view from QR scan (no login required)
 * @access  Public
 */
router.get('/scan/:pulseId', async (req, res) => {
    try {
        const { pulseId } = req.params;

        const user = await getUserModel().findOne({ pulseId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Pulse ID not found',
            });
        }

        // Get AI-processed records
        const records = await getMedicalRecordModel().find({
            userId: user._id,
            aiProcessed: true,
        }).sort({ uploadDate: -1 });

        // Emergency view - limited info
        const emergencyView = {
            name: user.name,
            pulseId: user.pulseId,
            bloodGroup: user.bloodGroup,
            allergies: [],
            chronicConditions: [],
            currentMedications: [],
            emergencySummary: '',
            riskLevel: 'GREEN',
        };

        // Aggregate from records
        records.forEach(record => {
            if (record.aiAnalysis) {
                emergencyView.allergies.push(...(record.aiAnalysis.allergies || []));
                emergencyView.chronicConditions.push(...(record.aiAnalysis.chronicConditions || []));
                emergencyView.currentMedications.push(...(record.aiAnalysis.medications || []));

                if (record.aiAnalysis.riskLevel === 'RED') emergencyView.riskLevel = 'RED';
                else if (record.aiAnalysis.riskLevel === 'YELLOW' && emergencyView.riskLevel !== 'RED') {
                    emergencyView.riskLevel = 'YELLOW';
                }
            }
        });

        emergencyView.allergies = [...new Set(emergencyView.allergies)];
        emergencyView.chronicConditions = [...new Set(emergencyView.chronicConditions)];

        if (records[0]?.aiAnalysis) {
            emergencyView.emergencySummary = records[0].aiAnalysis.emergencySummary;
        }

        // Log access
        await getAccessLogModel().create({
            userId: user._id,
            accessType: 'qr-scan',
            accessedBy: {
                name: req.body.doctorName || 'Unknown',
                role: 'doctor',
                institution: req.body.institution,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date(),
        });

        res.json({
            success: true,
            data: emergencyView,
        });
    } catch (error) {
        console.error('QR scan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency view',
        });
    }
});

/**
 * @route   POST /api/hospital/request-access
 * @desc    Request full access with OTP
 * @access  Public
 */
router.post('/request-access', async (req, res) => {
    try {
        const { pulseId, requester } = req.body;

        const user = await getUserModel().findOne({ pulseId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Pulse ID not found',
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Create consent request
        const consent = await getConsentModel().create({
            userId: user._id,
            requester,
            otp,
            otpExpiry,
            phoneNumber: user.emergencyContact.phone,
        });

        // Send OTP
        const smsResult = await sendOTP(user.emergencyContact.phone, otp);

        res.json({
            success: true,
            message: 'OTP sent to patient emergency contact',
            data: {
                consentId: consent._id,
                mockOtp: smsResult.mockOtp, // Only for demo - remove in production
            },
        });
    } catch (error) {
        console.error('Access request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to request access',
        });
    }
});

/**
 * @route   POST /api/hospital/verify-otp
 * @desc    Verify OTP and grant access
 * @access  Public
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { consentId, otp } = req.body;

        const consent = await getConsentModel().findById(consentId).select('+otp');
        if (!consent) {
            return res.status(404).json({
                success: false,
                message: 'Consent request not found',
            });
        }

        // Check if OTP is valid
        if (typeof consent.isOtpValid === 'function' && !consent.isOtpValid()) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or too many attempts',
            });
        }

        // Verify OTP
        if (consent.otp !== otp) {
            consent.verificationAttempts = (consent.verificationAttempts || 0) + 1;
            await consent.save();

            return res.status(401).json({
                success: false,
                message: 'Invalid OTP',
                attemptsRemaining: Math.max(0, 3 - consent.verificationAttempts),
            });
        }

        // Grant access
        consent.status = 'approved';
        consent.grantedAt = new Date();
        consent.accessExpiry = new Date(Date.now() + (consent.accessDuration || 60) * 60 * 1000);
        await consent.save();

        // Log access
        await getAccessLogModel().create({
            userId: consent.userId,
            accessType: 'full-access',
            accessedBy: consent.requester,
            consentGiven: true,
            otpVerified: true,
            ipAddress: req.ip,
            timestamp: new Date(),
        });

        res.json({
            success: true,
            message: 'Access granted',
            data: {
                consentId: consent._id,
                accessExpiry: consent.accessExpiry,
            },
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed',
        });
    }
});

/**
 * @route   GET /api/hospital/patient/:pulseId
 * @desc    View full patient records (requires valid consent)
 * @access  Public (but requires consentId)
 */
router.get('/patient/:pulseId', async (req, res) => {
    try {
        const { pulseId } = req.params;
        const { consentId } = req.query;

        if (!consentId) {
            return res.status(403).json({
                success: false,
                message: 'Consent required for full access',
            });
        }

        // Verify consent
        const consent = await getConsentModel().findById(consentId);
        if (!consent || (typeof consent.isAccessValid === 'function' && !consent.isAccessValid())) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired consent',
            });
        }

        const user = await getUserModel().findOne({ pulseId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Get all records
        const records = await getMedicalRecordModel().find({ userId: user._id })
            .sort({ uploadDate: -1 });

        // Full patient data
        const patientData = {
            profile: user.getPublicProfile(),
            records: records,
            medicalSummary: {
                totalRecords: records.length,
                latestUpdate: records[0]?.uploadDate || null,
            },
        };

        res.json({
            success: true,
            data: patientData,
        });
    } catch (error) {
        console.error('Patient view error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient data',
        });
    }
});

/**
 * @route   POST /api/hospital/upload-record
 * @desc    Doctor uploads new treatment record
 * @access  Public (requires consentId)
 */
router.post('/upload-record', upload.single('file'), async (req, res) => {
    try {
        const { pulseId, consentId, documentType, notes } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        // Verify consent
        const consent = await getConsentModel().findById(consentId);
        if (!consent || (typeof consent.isAccessValid === 'function' && !consent.isAccessValid())) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired consent',
            });
        }

        const user = await getUserModel().findOne({ pulseId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Upload file
        const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'image';
        const uploadResult = await uploadToCloud(
            req.file.buffer,
            `medical-records/${user.pulseId}`,
            fileType === 'pdf' ? 'raw' : 'image'
        );

        // Create record
        const record = await getMedicalRecordModel().create({
            userId: user._id,
            fileName: req.file.originalname,
            fileUrl: uploadResult.secure_url,
            fileType,
            cloudinaryPublicId: uploadResult.public_id,
            documentType: documentType || 'consultation',
            uploadedBy: consent.requester.name || 'Hospital Staff',
            processingStatus: 'pending',
            uploadDate: new Date()
        });

        // Log upload
        await getAccessLogModel().create({
            userId: user._id,
            accessType: 'hospital-upload',
            accessedBy: consent.requester,
            consentGiven: true,
            recordsAccessed: [record._id],
            reason: notes || 'Treatment record upload',
            ipAddress: req.ip,
            timestamp: new Date(),
        });

        res.status(201).json({
            success: true,
            message: 'Record uploaded successfully',
            data: record,
        });
    } catch (error) {
        console.error('Hospital upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed',
        });
    }
});

/**
 * @route   POST /api/hospital/ask
 * @desc    Doctor asks a natural-language question about the patient
 *          (RAG — requires the same valid consentId as /patient/:pulseId,
 *          retrieval strictly scoped to that one patient's userId)
 * @access  Public (requires consentId)
 */
router.post('/ask', async (req, res) => {
    try {
        const { pulseId, consentId, question } = req.body;

        if (!consentId) {
            return res.status(403).json({
                success: false,
                message: 'Consent required for full access',
            });
        }

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Question is required',
            });
        }

        const consent = await getConsentModel().findById(consentId);
        if (!consent || (typeof consent.isAccessValid === 'function' && !consent.isAccessValid())) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired consent',
            });
        }

        const user = await getUserModel().findOne({ pulseId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        const result = await answerFromRecords(user._id, question.trim());

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Hospital RAG ask error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to answer question',
        });
    }
});

module.exports = router;

