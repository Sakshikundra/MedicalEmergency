const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
    {
        // Authentication
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't return password by default
        },

        // Pulse ID (Unique Health Identifier)
        pulseId: {
            type: String,
            unique: true,
            default: () => `PULSE-${uuidv4().split('-')[0].toUpperCase()}`,
            immutable: true,
        },

        // Profile Information
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Date of birth is required'],
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: [true, 'Gender is required'],
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            required: [true, 'Blood group is required'],
        },

        // Emergency Contact
        emergencyContact: {
            name: {
                type: String,
                required: [true, 'Emergency contact name is required'],
            },
            relationship: {
                type: String,
            },
            phone: {
                type: String,
                required: [true, 'Emergency contact phone is required'],
            },
        },

        // QR Code
        qrCodeUrl: {
            type: String,
        },

        // User Role
        role: {
            type: String,
            enum: ['patient', 'doctor', 'admin'],
            default: 'patient',
        },

        // Account Status
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        pulseId: this.pulseId,
        dateOfBirth: this.dateOfBirth,
        gender: this.gender,
        bloodGroup: this.bloodGroup,
        emergencyContact: this.emergencyContact,
        qrCodeUrl: this.qrCodeUrl,
        role: this.role,
        createdAt: this.createdAt,
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
