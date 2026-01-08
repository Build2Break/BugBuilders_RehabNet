const ProgressLog = require('../models/ProgressLog');
const Patient = require('../models/Patient');
const Exercise = require('../models/Exercise');
const RehabProfile = require('../models/RehabProfile');

// @desc    Log daily progress (Pain, Confidence, Notes, Exercises)
// @route   POST /api/progress
// @access  Private (Patient)
exports.logDailyProgress = async (req, res) => {
    try {
        const { rehabPatientID, date, painLevel, confidenceLevel, notes, completedExercises } = req.body;

        // Verify patient ownership (IDOR prevention)
        if (req.userRole === 'patient' && req.user.rehabPatientID !== rehabPatientID) {
            return res.status(403).json({ message: 'Not authorized to log progress for another patient' });
        }

        // Normalize date to YYYY-MM-DD to ensure one log per day
        const logDate = new Date(date);
        logDate.setHours(0, 0, 0, 0);

        // Find existing log for today or create new
        let log = await ProgressLog.findOne({
            rehabPatientID,
            visitDate: {
                $gte: logDate,
                $lt: new Date(logDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (log) {
            // Update existing
            if (painLevel !== undefined) log.painLevel = painLevel;
            if (confidenceLevel !== undefined) log.confidenceLevel = confidenceLevel;
            if (notes !== undefined) log.notes = notes;
            if (completedExercises) log.completedExercises = completedExercises;
            await log.save();
        } else {
            // Create new
            log = await ProgressLog.create({
                rehabPatientID,
                visitDate: logDate,
                painLevel,
                confidenceLevel,
                notes,
                completedExercises: completedExercises || []
            });
        }

        // Streak Logic
        // Check if all assigned exercises are completed
        // For simplicity, we assume if the frontend sends "all completed", we increment.
        // Or better: Check count of assigned vs completed.
        const assignedCount = await Exercise.countDocuments({ rehabPatientID });
        const completedCount = log.completedExercises.length;

        if (assignedCount > 0 && completedCount >= assignedCount) {
            const patient = await Patient.findOne({ rehabPatientID });
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lastUpdate = patient.lastStreakUpdate ? new Date(patient.lastStreakUpdate) : null;
            if (lastUpdate) lastUpdate.setHours(0, 0, 0, 0);

            // If last update was yesterday, increment. If today, do nothing. If older, reset to 1.
            const oneDay = 24 * 60 * 60 * 1000;

            if (!lastUpdate || (today.getTime() - lastUpdate.getTime() > oneDay)) {
                // Missed a day (or first time), reset to 1 (since today is done)
                // Note: logic can be refined for "streak protection", but for now strict.
                // Actually, if lastUpdate was BEFORE yesterday, streak breaks.
                if (lastUpdate && (today.getTime() - lastUpdate.getTime() === oneDay)) {
                    patient.streak += 1;
                } else if (!lastUpdate || (today.getTime() - lastUpdate.getTime() > oneDay)) {
                    patient.streak = 1;
                }
                patient.lastStreakUpdate = Date.now();
                await patient.save();
            } else if (today.getTime() === lastUpdate.getTime()) {
                // Already updated today, keep as is
            }
        }

        res.status(200).json({ success: true, data: log });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get weekly progress history
// @route   GET /api/progress/:rehabPatientID/history
// @access  Private (Patient/Doctor)
exports.getProgressHistory = async (req, res) => {
    try {
        const { rehabPatientID } = req.params;

        // Verify authorization
        if (req.userRole === 'patient') {
            if (req.user.rehabPatientID !== rehabPatientID) {
                return res.status(403).json({ message: 'Not authorized to view another patient\'s history' });
            }
        } else if (req.userRole === 'doctor') {
            // Check if doctor is assigned to this patient
            const profile = await RehabProfile.findOne({ rehabPatientID, assignedDoctorID: req.user.doctorId });
            if (!profile) {
                return res.status(403).json({ message: 'Not authorized to view this patient\'s history' });
            }
        }
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const logs = await ProgressLog.find({
            rehabPatientID,
            visitDate: { $gte: sevenDaysAgo }
        }).sort({ visitDate: 1 });

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
