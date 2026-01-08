const express = require('express');
const router = express.Router();
const { sendEmailOTP, verifyEmailOTP } = require('../controllers/otpController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/otp/send
// @desc    Send OTP to email for verification
// @access  Private (Doctor)
router.post('/send', protect, sendEmailOTP);

// @route   POST /api/otp/verify
// @desc    Verify OTP code
// @access  Private (Doctor)
router.post('/verify', protect, verifyEmailOTP);

module.exports = router;
