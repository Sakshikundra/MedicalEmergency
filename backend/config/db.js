const mongoose = require('mongoose');

let isConnected = false;

// If USE_MOCK_DB=true in .env, always use mock DB regardless of MongoDB availability
const forceMock = process.env.USE_MOCK_DB === 'true';

const connectDB = async () => {
  if (forceMock) {
    console.log('🗂️  USE_MOCK_DB=true — skipping MongoDB, using mock database');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.log('💡 Server will continue to run, but database features may fail. Please ensure MongoDB is running at 27017.');
    isConnected = false;
  }
};

const getDBStatus = () => forceMock ? false : isConnected;

module.exports = { connectDB, getDBStatus };
