const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Auth Doctor & get token
// @route   POST /api/auth/login
// @access  Public
const loginDoctor = async (req, res, next) => {
    try {
        const { doctorId, password } = req.body;

        // Validate request
        if (!doctorId || !password) {
            return res.status(400).json({ success: false, message: 'Please provide doctorId and password' });
        }

        // Check for doctor
        const doctor = await Doctor.findOne({ doctorId });

        if (!doctor) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!doctor.isActive) {
            return res.status(403).json({ success: false, message: 'Account is inactive' });
        }

        // Match password
        const isMatch = await bcrypt.compare(password, doctor.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create Token
        const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(200).json({
            success: true,
            token,
            data: {
                id: doctor._id,
                doctorId: doctor.doctorId,
                name: doctor.name
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { loginDoctor };
