const express = require('express');
const router = express.Router();
const {
    assignExercise,
    getPatientExercises,
    updateExercise,
    deleteExercise,
    completeSet,
    getExercisePerformance,
    proxyOpenCVResult
} = require('../controllers/exerciseController');
const { protect } = require('../middleware/authMiddleware');

// Route definitions - ORDER MATTERS
// Static routes must come BEFORE dynamic routes (/:param) to avoid shadowing

// Proxy Route (Must be first)
router.get('/proxy/result', protect, proxyOpenCVResult);

// Standard Routes
router.post('/', protect, assignExercise);

// Dynamic Routes
router.get('/:rehabPatientID', protect, getPatientExercises);
router.get('/:rehabPatientID/performance', protect, getExercisePerformance);

router.put('/:id', protect, updateExercise);
router.post('/:id/complete-set', protect, completeSet);
router.delete('/:id', protect, deleteExercise);

module.exports = router;
