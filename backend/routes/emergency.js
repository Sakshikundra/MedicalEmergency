const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const AccessLog = require('../models/AccessLog');
const { sendEmergencyAlert } = require('../services/smsService');
const PDFDocument = require('pdfkit');
const { getDBStatus } = require('../config/db');
const { mockUser, mockMedicalRecord, mockAccessLog } = require('../utils/mockDb');

// Dynamic Model Selection
const getUserModel = () => getDBStatus() ? User : mockUser;
const getRecordModel = () => getDBStatus() ? MedicalRecord : mockMedicalRecord;
const getLogModel = () => getDBStatus() ? AccessLog : mockAccessLog;

/**
 * @route   GET /api/emergency/:pulseId
 * @desc    Get emergency profile (PUBLIC - no auth required)
 * @access  Public
 */
router.get('/:pulseId', async (req, res) => {
    try {
        const { pulseId } = req.params;

        // Find user by Pulse ID
        const user = await getUserModel().findOne({ pulseId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Pulse ID not found',
            });
        }

        // Get AI-processed medical records
        const records = await getRecordModel().find({
            userId: user._id,
            aiProcessed: true,
        }).sort({ uploadDate: -1 });

        // Aggregate emergency information
        const emergencyInfo = {
            name: user.name,
            pulseId: user.pulseId,
            bloodGroup: user.bloodGroup,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            emergencyContact: user.emergencyContact,

            // Medical summary from latest records
            allergies: [],
            chronicConditions: [],
            currentMedications: [],
            pastSurgeries: [],
            emergencySummary: '',
            riskLevel: 'GREEN',
        };

        // Aggregate data from all records
        records.forEach(record => {
            if (record.aiAnalysis) {
                emergencyInfo.allergies.push(...(record.aiAnalysis.allergies || []));
                emergencyInfo.chronicConditions.push(...(record.aiAnalysis.chronicConditions || []));
                emergencyInfo.currentMedications.push(...(record.aiAnalysis.medications || []));
                emergencyInfo.pastSurgeries.push(...(record.aiAnalysis.surgeries || []));

                // Use most severe risk level
                if (record.aiAnalysis.riskLevel === 'RED') {
                    emergencyInfo.riskLevel = 'RED';
                } else if (record.aiAnalysis.riskLevel === 'YELLOW' && emergencyInfo.riskLevel !== 'RED') {
                    emergencyInfo.riskLevel = 'YELLOW';
                }
            }
        });

        // Deduplicate arrays
        emergencyInfo.allergies = [...new Set(emergencyInfo.allergies)];
        emergencyInfo.chronicConditions = [...new Set(emergencyInfo.chronicConditions)];

        // Create emergency summary
        const latestRecord = records[0];
        if (latestRecord && latestRecord.aiAnalysis) {
            emergencyInfo.emergencySummary = latestRecord.aiAnalysis.emergencySummary;
        }

        // Log emergency access
        await getLogModel().create({
            userId: user._id,
            accessType: 'emergency-view',
            accessedBy: {
                name: 'Emergency Responder',
                role: 'emergency',
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date(),
        });

        res.json({
            success: true,
            data: emergencyInfo,
        });
    } catch (error) {
        console.error('Emergency profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency profile',
        });
    }
});

/**
 * @route   POST /api/emergency/sos
 * @desc    Trigger SOS alert
 * @access  Public (requires pulseId in body)
 */
router.post('/sos', async (req, res) => {
    try {
        const { pulseId, location } = req.body;

        const user = await getUserModel().findOne({ pulseId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Pulse ID not found',
            });
        }

        // Get emergency summary
        const latestRecord = await getRecordModel().findOne({
            userId: user._id,
            aiProcessed: true,
        }).sort({ uploadDate: -1 });

        const summary = latestRecord?.aiAnalysis?.emergencySummary ||
            `Blood Group: ${user.bloodGroup}`;

        // Send alert to emergency contact
        const alertResult = await sendEmergencyAlert(
            user.emergencyContact.phone,
            {
                patientName: user.name,
                location: location || 'Unknown',
                summary,
            }
        );

        // Log SOS access
        await getLogModel().create({
            userId: user._id,
            accessType: 'emergency-view',
            accessedBy: {
                name: user.name,
                role: 'patient-sos',
            },
            location: location ? {
                latitude: location.lat,
                longitude: location.lng,
            } : undefined,
            reason: 'SOS Alert Triggered',
            ipAddress: req.ip,
            timestamp: new Date(),
        });

        res.json({
            success: true,
            message: 'SOS alert sent successfully',
            data: alertResult,
        });
    } catch (error) {
        console.error('SOS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send SOS alert',
        });
    }
});

/**
 * @route   GET /api/emergency/card/:pulseId
 * @desc    Generate offline emergency card (PDF)
 * @access  Public
 */
router.get('/card/:pulseId', async (req, res) => {
    try {
        const { pulseId } = req.params;

        const user = await getUserModel().findOne({ pulseId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Pulse ID not found',
            });
        }

        // Get medical summary
        const records = await getRecordModel().find({
            userId: user._id,
            aiProcessed: true,
        }).sort({ uploadDate: -1 }).limit(5);

        // Create PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=emergency-card-${pulseId}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add content
        doc.fontSize(24).text('EMERGENCY MEDICAL CARD', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Pulse ID: ${pulseId}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(16).text('Patient Information');
        doc.fontSize(12);
        doc.text(`Name: ${user.name}`);
        doc.text(`Blood Group: ${user.bloodGroup}`);
        doc.text(`DOB: ${new Date(user.dateOfBirth).toLocaleDateString()}`);
        doc.text(`Gender: ${user.gender}`);
        doc.moveDown();

        doc.fontSize(16).text('Emergency Contact');
        doc.fontSize(12);
        doc.text(`Name: ${user.emergencyContact.name}`);
        doc.text(`Phone: ${user.emergencyContact.phone}`);
        doc.moveDown();

        // Medical info
        if (records.length > 0) {
            const allergies = [...new Set(records.flatMap(r => r.aiAnalysis?.allergies || []))];
            const chronic = [...new Set(records.flatMap(r => r.aiAnalysis?.chronicConditions || []))];

            if (allergies.length > 0) {
                doc.fontSize(16).fillColor('red').text('⚠️ ALLERGIES');
                doc.fontSize(12).fillColor('black');
                allergies.forEach(allergy => doc.text(`• ${allergy}`));
                doc.moveDown();
            }

            if (chronic.length > 0) {
                doc.fontSize(16).text('Chronic Conditions');
                doc.fontSize(12);
                chronic.forEach(condition => doc.text(`• ${condition}`));
            }
        }

        doc.end();
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate emergency card',
        });
    }
});

module.exports = router;
