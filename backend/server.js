require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// Global Error Handlers to prevent server crashes
process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION:', reason);
});


// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002'
];

if (process.env.FRONTEND_URL) {
    const customOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    allowedOrigins.push(...customOrigins);
}

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/records', require('./routes/records'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/hospital', require('./routes/hospital'));

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'CareChain Passport API is running',
        timestamp: new Date().toISOString(),
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to CareChain Passport API',
        version: '1.0.0',
        docs: '/api/docs',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏥  CareChain Passport API Server                  ║
║                                                       ║
║   Server running on: http://localhost:${PORT}         ║
║   Environment: ${process.env.NODE_ENV || 'development'}                       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
