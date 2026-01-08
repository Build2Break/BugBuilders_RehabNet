const nodemailer = require('nodemailer');

// Create transporter - will use console simulation if no SMTP config
let transporter = null;

// Check if email config exists
const hasEmailConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

if (hasEmailConfig) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} - Success status
 */
const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@rehabnet.com',
        to: email,
        subject: 'RehabNet - Email Verification OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0ea5e9; text-align: center;">RehabNet Email Verification</h2>
                <p>Your One-Time Password (OTP) for email verification is:</p>
                <div style="background: #f0f9ff; padding: 20px; text-align: center; 
                            font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                            color: #0ea5e9; border-radius: 8px; border: 2px dashed #0ea5e9; margin: 20px 0;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 14px;">
                    This OTP is valid for <strong>5 minutes</strong>. Do not share this code with anyone.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    If you didn't request this verification, please ignore this email.
                </p>
            </div>
        `
    };

    try {
        if (transporter) {
            // Send real email
            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL SENT] To: ${email}, OTP: ${otp}`);
        } else {
            // Simulate email sending (for development)
            console.log('═'.repeat(60));
            console.log('[EMAIL SIMULATION] - No SMTP configured');
            console.log(`To: ${email}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`OTP Code: ${otp}`);
            console.log('═'.repeat(60));
        }
        return true;
    } catch (error) {
        console.error('[EMAIL ERROR]', error.message);
        return false;
    }
};

module.exports = { sendOTP };
