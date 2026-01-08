const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const noSqlSanitizer = require('./middleware/noSqlSanitizer');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security Middleware
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10kb' })); // Parse JSON bodies with limit
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(noSqlSanitizer); // Prevent NoSQL injection

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/exercises', require('./routes/exerciseRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
