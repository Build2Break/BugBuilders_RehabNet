const Patient = require('../models/Patient');
const RehabProfile = require('../models/RehabProfile');
const Exercise = require('../models/Exercise');
const ProgressLog = require('../models/ProgressLog');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Create a new patient
// @route   POST /api/patients
// @access  Private (Doctor)
exports.createPatient = async (req, res) => {
    try {
        const { hospitalPatientID, username, mobileNumber, email, primaryDiagnosis, rehabStartDate, rehabEndDate, verificationToken } = req.body;

        // Verify email OTP before creating patient
        if (!verificationToken) {
            return res.status(400).json({
                success: false,
                message: 'Email verification is required. Please verify the patient email first.'
            });
        }

        // Check if email is verified with valid token
        const otpRecord = await Otp.findOne({
            email: email.toLowerCase(),
            verificationToken: verificationToken,
            verified: true
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired email verification. Please verify the email again.'
            });
        }

        // Check for duplicates
        const existingPatient = await Patient.findOne({ $or: [{ username }, { mobileNumber }, { email }] });
        if (existingPatient) {
            return res.status(400).json({ message: 'Patient with this Username, Mobile, or Email already exists' });
        }

        // Generate RehabPatientID
        const rehabPatientID = 'RP' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);

        // Auto-generate 6-char alphanumeric password
        const generatedPassword = Math.random().toString(36).slice(-6).toUpperCase();

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(generatedPassword, salt);

        // Create Patient
        const patient = await Patient.create({
            rehabPatientID,
            hospitalPatientID,
            username,
            mobileNumber,
            email,
            passwordHash
        });

        // Create RehabProfile
        // Get the doctorId from the authenticated user - ensure we use doctorId field, not MongoDB _id
        const doctorIdToAssign = req.user && req.user.doctorId ? req.user.doctorId : 'unknown';
        console.log('[DEBUG] Creating RehabProfile with assignedDoctorID:', doctorIdToAssign);
        console.log('[DEBUG] req.user object:', JSON.stringify(req.user, null, 2));

        const rehabProfile = await RehabProfile.create({
            rehabPatientID,
            primaryDiagnosis,
            rehabStartDate,
            rehabEndDate,
            assignedDoctorID: doctorIdToAssign,
            status: 'Active'
        });

        // Clean up used OTP record
        await Otp.deleteOne({ _id: otpRecord._id });

        // In a real app, you might email this password to the patient here.
        console.log(`[EMAIL SIMULATION] To: ${email}, Subject: Welcome, Message: Your login password is: ${generatedPassword}`);

        res.status(201).json({
            success: true,
            data: {
                patient,
                rehabProfile,
                generatedPassword // Send back to doctor to display one-time
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Forgot Password (Send Reset Email)
// @route   POST /api/patients/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const patient = await Patient.findOne({ email });

        if (!patient) {
            return res.status(404).json({ message: 'Patient with this email not found' });
        }

        // Generate Reset Token (Simple random string for demo, ideally use crypto or jwt)
        const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase();

        // In a real app, save this token to DB with expiry and verify later. 
        // For this specific request, we'll just simulate sending a new temporary password or link.
        // Let's reset the password directly to this new "token" for simplicity if that's the requirement,
        // OR just simulate sending a link. 
        // User asked for "reset password... email is sent".

        // Simulating sending a "Reset Link" or "New Password"
        // Let's generate a temporary password and set it, asking them to change it?
        // Or just log the token.

        console.log(`[EMAIL SIMULATION] To: ${email}, Subject: Password Reset, Message: Your password reset code is: ${resetToken}`);

        res.json({ success: true, message: 'Password reset email sent (check server logs)' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Login patient
// @route   POST /api/patients/login
// @access  Public
exports.loginPatient = async (req, res) => {
    try {
        const { identifier, password } = req.body; // Identifier can be Username or Mobile

        // Find patient
        const patient = await Patient.findOne({
            $or: [{ username: identifier }, { mobileNumber: identifier }]
        });

        if (!patient) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, patient.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update LastLoginAt
        patient.lastLoginAt = Date.now();
        await patient.save();

        // Generate Token
        const token = jwt.sign({ id: patient._id, role: 'patient' }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.json({
            success: true,
            token,
            patient: {
                id: patient._id,
                rehabPatientID: patient.rehabPatientID,
                username: patient.username,
                mobileNumber: patient.mobileNumber
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get current patient profile
// @route   GET /api/patients/me
// @access  Private (Patient)
exports.getPatientProfile = async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.id).select('-passwordHash');
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json({ success: true, data: patient });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Doctor)
exports.getPatients = async (req, res) => {
    try {
        const doctorID = req.user.doctorId;

        // Aggregate to get patient details along with profile
        const patients = await Patient.aggregate([
            {
                $lookup: {
                    from: 'rehabprofiles',
                    localField: 'rehabPatientID',
                    foreignField: 'rehabPatientID',
                    as: 'profile'
                }
            },
            {
                $unwind: { path: '$profile', preserveNullAndEmptyArrays: true }
            },
            // Filter: Only return patients assigned to this doctor
            {
                $match: {
                    'profile.assignedDoctorID': doctorID
                }
            }
        ]);

        res.json({ success: true, data: patients });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update patient details
// @route   PUT /api/patients/:id
// @access  Private (Doctor)
exports.updatePatient = async (req, res) => {
    try {
        const { hospitalPatientID, username, mobileNumber, primaryDiagnosis, status, rehabEndDate } = req.body;

        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Verify Ownership
        const profile = await RehabProfile.findOne({ rehabPatientID: patient.rehabPatientID });

        if (!profile || profile.assignedDoctorID !== req.user.doctorId) {
            return res.status(403).json({ message: 'Not authorized to update this patient' });
        }

        // Update Patient fields
        if (hospitalPatientID) patient.hospitalPatientID = hospitalPatientID;
        if (username) patient.username = username;
        if (mobileNumber) patient.mobileNumber = mobileNumber;
        await patient.save();

        // Update Profile fields
        if (profile) {
            if (primaryDiagnosis) profile.primaryDiagnosis = primaryDiagnosis;
            if (status) profile.status = status;
            if (rehabEndDate) profile.rehabEndDate = rehabEndDate;
            await profile.save();
        }

        res.json({ success: true, message: 'Patient updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Doctor)
exports.deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const rehabID = patient.rehabPatientID;

        // Verify Ownership
        const profile = await RehabProfile.findOne({ rehabPatientID: rehabID });
        if (!profile || profile.assignedDoctorID !== req.user.doctorId) {
            return res.status(403).json({ message: 'Not authorized to delete this patient' });
        }

        // Delete Patient
        await Patient.deleteOne({ _id: req.params.id });

        // Cascading deletes
        await RehabProfile.deleteOne({ rehabPatientID: rehabID });
        await Exercise.deleteMany({ rehabPatientID: rehabID });
        await ProgressLog.deleteMany({ rehabPatientID: rehabID });

        res.json({ success: true, message: 'Patient and related records deleted' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
