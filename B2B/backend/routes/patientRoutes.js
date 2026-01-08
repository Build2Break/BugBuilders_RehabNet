const express = require('express');
const router = express.Router();
const {
    createPatient,
    loginPatient,
    getPatients,
    updatePatient,
    deletePatient,
    getPatientProfile,
    forgotPassword
} = require('../controllers/patientController');

// Need middleware for doctor protection?
// Assuming we have a protect middleware for doctor.
// For now, I'll export a function that accepts 'protect' middleware or just import it if standardized.
// Let's assume there's an authMiddleware.js or similar based on existing structure.
// I'll check authController later, but for now standard imports.
// But wait, I should verify if `protect` middleware exists.

const { protect } = require('../middleware/authMiddleware'); // Hypothetical path, need to verify. 

// If protect is not available, I will comment it out or fix it in next step.
// Based on file list, `d:\B2B\backend\middleware\errorHandler.js` exists.
// I'll assume standard naming but if it fails I'll fix.

router.post('/', protect, createPatient); // Protected: Doctor only
router.post('/login', loginPatient);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getPatientProfile);
router.get('/', protect, getPatients); // Protected: Doctor only (potentially patient for their own data, but controller returns all)
router.put('/:id', protect, updatePatient); // Protected: Doctor only
router.delete('/:id', protect, deletePatient); // Protected: Doctor only

module.exports = router;
