const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getDBStatus } = require('../config/db');
const { mockUser } = require('../utils/mockDb');
const { generateToken } = require('../middleware/auth');
const { generateQRCode } = require('../services/qrService');

// Use Real User model or Mock User based on DB status
const getModel = () => getDBStatus() ? User : mockUser;

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
    console.log('📝 Registration attempt for:', req.body.email);
    try {
        const {
            email,
            password,
            name,
            dateOfBirth,
            gender,
            bloodGroup,
            emergencyContact,
        } = req.body;

        // Check if user already exists
        const UserModel = getModel();
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
        }

        // Create user
        const user = await UserModel.create({
            email,
            password,
            name,
            dateOfBirth,
            gender,
            bloodGroup,
            emergencyContact,
        });

        // Generate QR code
        const qrCodeDataUrl = await generateQRCode(user.pulseId);
        user.qrCodeUrl = qrCodeDataUrl;
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.getPublicProfile(),
                token,
            },
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during registration',
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Check user exists (include password for comparison)
        const UserModel = getModel();
        const user = await UserModel.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate QR code if missing (useful for mock users)
        if (!user.qrCodeUrl && user.pulseId) {
            console.log('🔄 Generating missing QR code for:', user.email);
            try {
                const qrCodeDataUrl = await generateQRCode(user.pulseId);
                user.qrCodeUrl = qrCodeDataUrl;
                await user.save();
            } catch (qrErr) {
                console.error('Failed to generate missing QR code:', qrErr);
            }
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.getPublicProfile(),
                token,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', require('../middleware/auth').protect, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user.getPublicProfile(),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});

module.exports = router;
