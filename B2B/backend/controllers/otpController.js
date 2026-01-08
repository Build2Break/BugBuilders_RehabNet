const Otp = require('../models/Otp');
const { sendOTP } = require('../utils/emailService');
const crypto = require('crypto');

/**
 * Generate a 6-digit numeric OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a secure verification token
 */
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// @desc    Send OTP to email
// @route   POST /api/otp/send
// @access  Private (Doctor)
exports.sendEmailOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Delete any existing OTPs for this email
        await Otp.deleteMany({ email: email.toLowerCase() });

        // Generate new OTP
        const otp = generateOTP();

        // Save OTP to database
        await Otp.create({
            email: email.toLowerCase(),
            otp: otp
        });

        // Send OTP via email
        const emailSent = await sendOTP(email, otp);

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email'
            });
        }

        res.json({
            success: true,
            message: 'OTP sent successfully to ' + email
        });

    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while sending OTP',
            error: error.message
        });
    }
};

// @desc    Verify OTP
// @route   POST /api/otp/verify
// @access  Private (Doctor)
exports.verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        // Find the OTP record
        const otpRecord = await Otp.findOne({
            email: email.toLowerCase(),
            otp: otp
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Update OTP record as verified
        otpRecord.verified = true;
        otpRecord.verificationToken = verificationToken;
        await otpRecord.save();

        res.json({
            success: true,
            message: 'Email verified successfully',
            verificationToken: verificationToken
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while verifying OTP',
            error: error.message
        });
    }
};

// @desc    Check if email is verified (internal use)
// @param   {string} email - Email to check
// @param   {string} verificationToken - Token from verification
// @returns {Promise<boolean>}
exports.isEmailVerified = async (email, verificationToken) => {
    try {
        const otpRecord = await Otp.findOne({
            email: email.toLowerCase(),
            verificationToken: verificationToken,
            verified: true
        });
        return !!otpRecord;
    } catch (error) {
        console.error('Check verification error:', error);
        return false;
    }
};
