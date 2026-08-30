const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getDBStatus } = require('../config/db');
const { mockUser } = require('../utils/mockDb');

// Use Real User model or Mock User based on DB status
const getModel = () => getDBStatus() ? User : mockUser;

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token (exclude password)
            // Use the correct model based on current DB connection status
            const UserModel = getModel();

            // Note: mockUser.findById handles the .select() chain locally
            req.user = await UserModel.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                });
            }

            next();
        } catch (error) {
            console.error('Auth middleware error:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed',
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token provided',
        });
    }
};

/**
 * Generate JWT token
 * @param {String} id - User ID
 * @returns {String} JWT token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};

module.exports = {
    protect,
    generateToken,
};
