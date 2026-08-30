// Comprehensive persistent mock database for testing when MongoDB is not available
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'mock_db.json');

// Global in-memory storage (initialized from file if exists)
let storage = {
    users: [
        {
            _id: 'admin-user-id',
            name: 'Admin User',
            email: 'admin@medix.com',
            password: 'password123',
            role: 'admin',
            pulseId: 'PULSE-ADMIN',
            dateOfBirth: new Date('1980-01-01'),
            gender: 'Other',
            bloodGroup: 'O+',
            emergencyContact: { name: 'Admin HQ', phone: '000-000-0000' },
            createdAt: new Date(),
        },
        {
            _id: 'hospital-user-id',
            name: 'City Hospital',
            email: 'hospital@medix.com',
            password: 'password123',
            role: 'doctor',
            pulseId: 'PULSE-HOSPITAL',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'Other',
            bloodGroup: 'O+',
            emergencyContact: { name: 'Hospital Admin', phone: '111-111-1111' },
            createdAt: new Date(),
        }
    ],
    medicalrecords: [],
    consents: [],
    accesslogs: []
};

// Load storage from file
const loadDB = () => {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const parsed = JSON.parse(data);
            // Re-merge to preserve the base users if not in file
            storage = { ...storage, ...parsed };
            console.log('📂 Mock DB loaded from file');
        }
    } catch (err) {
        console.error('⚠️ Failed to load mock DB:', err.message);
    }
};

// Save storage to file
const saveDB = () => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(storage, null, 2));
    } catch (err) {
        console.error('⚠️ Failed to save mock DB:', err.message);
    }
};

// Initial load
loadDB();

/**
 * Creates a mock document with Mongoose-like methods
 */
const createMockDoc = (data, collectionName) => {
    const doc = {
        ...data,
        _id: data._id || uuidv4(),
        save: async function () {
            const idx = storage[collectionName].findIndex(d => d._id === this._id);
            if (idx >= 0) {
                storage[collectionName][idx] = { ...this };
            } else {
                storage[collectionName].push({ ...this });
            }
            saveDB();
            return this;
        },
        deleteOne: async function () {
            storage[collectionName] = storage[collectionName].filter(d => d._id !== this._id);
            saveDB();
            return { deletedCount: 1 };
        }
    };

    // User-specific methods
    if (collectionName === 'users') {
        doc.getPublicProfile = function () {
            const { password, ...publicData } = this;
            return { ...publicData, id: this._id };
        };
        doc.comparePassword = async function (candidate) {
            return candidate === this.password;
        };
    }

    // Consent-specific methods (mirrors backend/models/Consent.js schema methods,
    // so OTP expiry / attempt-limit / access-duration checks are enforced in mock mode too)
    if (collectionName === 'consents') {
        doc.verificationAttempts = doc.verificationAttempts || 0;
        doc.isOtpValid = function () {
            return new Date(this.otpExpiry) > new Date() && this.verificationAttempts < 3;
        };
        doc.isAccessValid = function () {
            return this.status === 'approved' && this.accessExpiry && new Date(this.accessExpiry) > new Date();
        };
    }

    return doc;
};

/**
 * Creates a mock model query builder
 */
const createMockModel = (collectionName) => {
    return {
        _name: collectionName,
        find: function (query = {}) {
            console.log(`🔍 MockDB: Finding in ${collectionName}`, query);
            let results = storage[collectionName].filter(item => {
                for (let key in query) {
                    const val = item[key]?.toString();
                    const target = query[key]?.toString();
                    if (val !== target) return false;
                }
                return true;
            });
            console.log(`📊 MockDB: Found ${results.length} items`);

            // Return query builder for chaining
            const builder = {
                data: results.map(d => createMockDoc(d, collectionName)),
                // Mongoose-style sort: { field: 1 | -1 } or "-field"
                sort: function (spec) {
                    if (!spec) return this;
                    let field, direction;
                    if (typeof spec === 'string') {
                        direction = spec.startsWith('-') ? -1 : 1;
                        field = spec.replace(/^-/, '');
                    } else {
                        field = Object.keys(spec)[0];
                        direction = spec[field] === -1 || spec[field] === 'desc' ? -1 : 1;
                    }
                    this.data = [...this.data].sort((a, b) => {
                        const av = a[field] ? new Date(a[field]).getTime() || a[field] : a[field];
                        const bv = b[field] ? new Date(b[field]).getTime() || b[field] : b[field];
                        if (av === bv) return 0;
                        return av > bv ? direction : -direction;
                    });
                    return this;
                },
                limit: function (n) {
                    if (typeof n === 'number') {
                        this.data = this.data.slice(0, n);
                    }
                    return this;
                },
                select: function () { return this; },
                then: function (resolve) { resolve(this.data); },
                catch: function (reject) { }
            };
            return builder;
        },
        findOne: function (query = {}) {
            // Gather all matches (not just the first) so .sort() can pick the
            // right one before we collapse down to a single document.
            let matches = storage[collectionName].filter(item => {
                for (let key in query) {
                    const val = item[key]?.toString();
                    const target = query[key]?.toString();
                    if (val !== target) return false;
                }
                return true;
            });

            const builder = {
                _matches: matches,
                get data() {
                    const item = this._matches[0];
                    return item ? createMockDoc(item, collectionName) : null;
                },
                // Mongoose-style sort: { field: 1 | -1 } or "-field"
                sort: function (spec) {
                    if (!spec) return this;
                    let field, direction;
                    if (typeof spec === 'string') {
                        direction = spec.startsWith('-') ? -1 : 1;
                        field = spec.replace(/^-/, '');
                    } else {
                        field = Object.keys(spec)[0];
                        direction = spec[field] === -1 || spec[field] === 'desc' ? -1 : 1;
                    }
                    this._matches = [...this._matches].sort((a, b) => {
                        const av = a[field] ? new Date(a[field]).getTime() || a[field] : a[field];
                        const bv = b[field] ? new Date(b[field]).getTime() || b[field] : b[field];
                        if (av === bv) return 0;
                        return av > bv ? direction : -direction;
                    });
                    return this;
                },
                select: function () { return this; },
                then: function (resolve) { resolve(this.data); },
                catch: function (reject) { }
            };
            return builder;
        },
        findById: function (id) {
            return this.findOne({ _id: id });
        },
        create: async function (data) {
            console.log(`✨ MockDB: Creating record in ${collectionName}`, data.name || data.fileName || '');

            // Generate defaults for users
            if (collectionName === 'users') {
                if (!data.pulseId) {
                    data.pulseId = `PULSE-${uuidv4().split('-')[0].toUpperCase()}`;
                }
                if (!data.role) {
                    data.role = 'patient';
                }
            }

            // Generate defaults for consents
            if (collectionName === 'consents') {
                if (data.verificationAttempts === undefined) {
                    data.verificationAttempts = 0;
                }
                if (!data.status) {
                    data.status = 'pending';
                }
            }

            const doc = createMockDoc(data, collectionName);
            storage[collectionName].push({ ...doc });
            saveDB();
            return doc;
        },
        index: function () { } // Mock indexing
    };
};

module.exports = {
    mockUser: createMockModel('users'),
    mockMedicalRecord: createMockModel('medicalrecords'),
    mockConsent: createMockModel('consents'),
    mockAccessLog: createMockModel('accesslogs'),
    getDBStatus: () => false // Always false if using mockDb
};

