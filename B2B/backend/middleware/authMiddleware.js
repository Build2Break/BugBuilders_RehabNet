const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if user is Patient or Doctor
            // Note: Doctor tokens (existing) might not have 'role' field, so we try Doctor first if no role or role is 'doctor'

            if (decoded.role === 'patient') {
                req.user = await Patient.findById(decoded.id).select('-passwordHash');
                req.userRole = 'patient';
            } else {
                req.user = await Doctor.findById(decoded.id).select('-password');
                req.userRole = 'doctor';
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
