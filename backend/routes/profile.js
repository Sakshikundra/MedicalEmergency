const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const AccessLog = require('../models/AccessLog');
const { protect } = require('../middleware/auth');
const { getDBStatus } = require('../config/db');
const { mockUser, mockMedicalRecord, mockAccessLog } = require('../utils/mockDb');

// Helper to get real or mock model
const getUserModel = () => getDBStatus() ? User : mockUser;
const getMedicalRecordModel = () => getDBStatus() ? MedicalRecord : mockMedicalRecord;
const getAccessLogModel = () => getDBStatus() ? AccessLog : mockAccessLog;

/**
 * @route   GET /api/profile
 * @desc    Get user profile with QR code
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        const user = await getUserModel().findById(req.user._id);

        res.json({
            success: true,
            data: user.getPublicProfile(),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
        });
    }
});

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', protect, async (req, res) => {
    try {
        const {
            name,
            dateOfBirth,
            gender,
            bloodGroup,
            emergencyContact,
        } = req.body;

        const user = await getUserModel().findById(req.user._id);

        if (name) user.name = name;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (gender) user.gender = gender;
        if (bloodGroup) user.bloodGroup = bloodGroup;
        if (emergencyContact) user.emergencyContact = emergencyContact;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user.getPublicProfile(),
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
        });
    }
});

/**
 * @route   GET /api/profile/access-logs
 * @desc    Get access logs for current user
 * @access  Private
 */
router.get('/access-logs', protect, async (req, res) => {
    try {
        const logs = await getAccessLogModel().find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(50);

        res.json({
            success: true,
            count: logs.length,
            data: logs,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch access logs',
        });
    }
});

/**
 * @route   GET /api/profile/health-summary
 * @desc    Get AI-generated health summary
 * @access  Private
 */
router.get('/health-summary', protect, async (req, res) => {
    try {
        const records = await getMedicalRecordModel().find({
            userId: req.user._id,
            aiProcessed: true,
        }).sort({ uploadDate: -1 });

        if (records.length === 0) {
            return res.json({
                success: true,
                data: {
                    summary: 'No medical records uploaded yet.',
                    riskLevel: 'GREEN',
                    totalRecords: 0
                },
            });
        }

        // Aggregate health data
        const healthSummary = {
            totalRecords: records.length,
            lastUpdated: records[0].uploadDate,
            allergies: [],
            chronicConditions: [],
            currentMedications: [],
            recentDiagnoses: [],
            riskLevel: 'GREEN',
            riskFactors: [],
        };

        records.forEach(record => {
            if (record.aiAnalysis) {
                healthSummary.allergies.push(...(record.aiAnalysis.allergies || []));
                healthSummary.chronicConditions.push(...(record.aiAnalysis.chronicConditions || []));
                healthSummary.currentMedications.push(...(record.aiAnalysis.medications || []));
                healthSummary.recentDiagnoses.push(...(record.aiAnalysis.diagnoses || []));
                healthSummary.riskFactors.push(...(record.aiAnalysis.riskFactors || []));

                if (record.aiAnalysis.riskLevel === 'RED') healthSummary.riskLevel = 'RED';
                else if (record.aiAnalysis.riskLevel === 'YELLOW' && healthSummary.riskLevel !== 'RED') {
                    healthSummary.riskLevel = 'YELLOW';
                }
            }
        });

        // Deduplicate
        healthSummary.allergies = [...new Set(healthSummary.allergies)];
        healthSummary.chronicConditions = [...new Set(healthSummary.chronicConditions)];
        healthSummary.riskFactors = [...new Set(healthSummary.riskFactors)];

        // Use latest patient explanation as summary
        healthSummary.summary = records[0].aiAnalysis?.patientExplanation ||
            'Your medical records have been processed and analyzed.';

        res.json({
            success: true,
            data: healthSummary,
        });
    } catch (error) {
        console.error('Health summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate health summary',
        });
    }
});

module.exports = router;

