/**
 * Seed script — creates a demo patient (with a couple of medical records)
 * in a real MongoDB database.
 *
 * Usage: npm run seed   (run from the backend/ folder, with MONGODB_URI
 * pointing at a real MongoDB instance — this script does NOT touch the
 * mock DB, since mock mode already ships with PULSE-ADMIN / PULSE-HOSPITAL
 * demo users in utils/mock_db.json)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');

const DEMO_PASSWORD = 'password123';

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB for seeding');

        let patient = await User.findOne({ email: 'demo.patient@medix.com' });
        if (!patient) {
            patient = await User.create({
                email: 'demo.patient@medix.com',
                password: DEMO_PASSWORD,
                name: 'Demo Patient',
                dateOfBirth: new Date('1995-06-15'),
                gender: 'Other',
                bloodGroup: 'O+',
                role: 'patient',
                emergencyContact: {
                    name: 'Demo Emergency Contact',
                    relationship: 'Friend',
                    phone: '+91-9999999999',
                },
            });
            console.log('✅ Created demo patient:', patient.pulseId);
        }

        let admin = await User.findOne({ email: 'admin@medix.com' });
        if (!admin) {
            admin = await User.create({
                email: 'admin@medix.com',
                password: DEMO_PASSWORD,
                name: 'Admin User',
                dateOfBirth: new Date('1980-01-01'),
                gender: 'Other',
                bloodGroup: 'O+',
                role: 'admin',
                pulseId: 'PULSE-ADMIN',
                emergencyContact: { name: 'Admin HQ', phone: '000-000-0000' },
            });
            console.log('✅ Created admin user:', admin.pulseId);
        }

        let hospital = await User.findOne({ email: 'hospital@medix.com' });
        if (!hospital) {
            hospital = await User.create({
                email: 'hospital@medix.com',
                password: DEMO_PASSWORD,
                name: 'City Hospital',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'Other',
                bloodGroup: 'O+',
                role: 'doctor',
                pulseId: 'PULSE-HOSPITAL',
                emergencyContact: { name: 'Hospital Admin', phone: '111-111-1111' },
            });
            console.log('✅ Created hospital user:', hospital.pulseId);
        }

        await MedicalRecord.create({
            userId: patient._id,
            fileName: 'demo-lab-report.pdf',
            fileUrl: 'https://example.com/demo-lab-report.pdf',
            fileType: 'pdf',
            documentType: 'lab-report',
            aiProcessed: true,
            processingStatus: 'completed',
            uploadDate: new Date(),
            aiAnalysis: {
                diagnoses: ['Type 2 Diabetes'],
                medications: [{ name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }],
                allergies: ['Penicillin'],
                surgeries: [],
                chronicConditions: ['Type 2 Diabetes'],
                emergencySummary: 'Patient has Type 2 Diabetes and a penicillin allergy.',
                doctorSummary: 'Demo seeded record for testing the AI summary pipeline.',
                patientExplanation: 'This is demo/sample data for testing purposes.',
                riskLevel: 'YELLOW',
                riskFactors: ['Diabetes'],
                drugInteractions: [],
            },
        });

        console.log('✅ Created demo medical record');
        console.log(`\n🎉 Seed complete. Login with demo.patient@medix.com / ${DEMO_PASSWORD}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seed();
