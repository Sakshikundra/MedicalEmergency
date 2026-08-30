const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('SUCCESS: Connected to MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('FAILURE: Could not connect to MongoDB');
        console.error(err.message);
        process.exit(1);
    }
};

testConnection();
