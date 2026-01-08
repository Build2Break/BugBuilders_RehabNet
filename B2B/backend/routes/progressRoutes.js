const express = require('express');
const router = express.Router();
const { logDailyProgress, getProgressHistory } = require('../controllers/progressController');

// We should protect these. Assuming we have auth middleware available globally or pass it.
// For now, open or assume app handles token. Ideally: router.use(protect);
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, logDailyProgress);
router.get('/:rehabPatientID/history', protect, getProgressHistory);

module.exports = router;
