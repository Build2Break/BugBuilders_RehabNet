const Exercise = require('../models/Exercise');
const ProgressLog = require('../models/ProgressLog');
const RehabProfile = require('../models/RehabProfile');
const axios = require('axios');

// @desc    Assign new exercise to patient
// @route   POST /api/exercises
// @access  Private (Doctor)
exports.assignExercise = async (req, res) => {
    try {
        const { rehabPatientID, exerciseName, numberOfSets, timePerSet, confidenceThreshold } = req.body;

        // Verify patient belongs to this doctor
        const profile = await RehabProfile.findOne({ rehabPatientID, assignedDoctorID: req.user.doctorId });
        if (!profile) {
            return res.status(403).json({ message: 'Not authorized to assign exercises to this patient' });
        }

        const exercise = await Exercise.create({
            rehabPatientID,
            exerciseName: exerciseName || 'Tree Pose',
            numberOfSets: numberOfSets || 3,
            timePerSet: timePerSet || 30,
            confidenceThreshold: confidenceThreshold || 70
        });

        res.status(201).json({ success: true, data: exercise });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Validation Error', error: error.message });
    }
};

// @desc    Get exercises for a patient (with Daily Reset)
// @route   GET /api/exercises/:rehabPatientID
// @access  Private (Doctor/Patient)
exports.getPatientExercises = async (req, res) => {
    try {
        let exercises = await Exercise.find({ rehabPatientID: req.params.rehabPatientID });
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validExercises = [];

        // Process each exercise
        for (const exercise of exercises) {
            // Check if exercise name is valid (in new schema)
            const validNames = ['Tree Pose'];
            if (!validNames.includes(exercise.exerciseName)) {
                // Delete legacy exercise with invalid name
                await Exercise.findByIdAndDelete(exercise._id);
                console.log(`Deleted legacy exercise: ${exercise.exerciseName}`);
                continue;
            }

            // Lazy Reset: Check if lastUpdated is before today
            const lastUpdateDate = new Date(exercise.lastUpdated);
            lastUpdateDate.setHours(0, 0, 0, 0);

            if (lastUpdateDate < today) {
                exercise.completedSets = [];
                exercise.lastUpdated = Date.now();
                await exercise.save();
            }

            validExercises.push(exercise);
        }

        res.json({ success: true, data: validExercises });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update exercise assignment
// @route   PUT /api/exercises/:id
// @access  Private (Doctor)
exports.updateExercise = async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Verify ownership (Doctor must be assigned to patient)
        const profile = await RehabProfile.findOne({ rehabPatientID: exercise.rehabPatientID, assignedDoctorID: req.user.doctorId });
        if (!profile) {
            return res.status(403).json({ message: 'Not authorized to update this exercise' });
        }

        // Update allowed fields
        const allowedFields = ['exerciseName', 'numberOfSets', 'timePerSet', 'confidenceThreshold'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                exercise[field] = req.body[field];
            }
        });

        await exercise.save();

        res.json({ success: true, data: exercise });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Update Failed', error: error.message });
    }
};

// @desc    Complete a set for an exercise (called by patient)
// @route   POST /api/exercises/:id/complete-set
// @access  Private (Patient)
exports.completeSet = async (req, res) => {
    try {
        const { confidenceScore } = req.body;
        const exercise = await Exercise.findById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Verify Patient Ownership
        if (exercise.rehabPatientID !== req.user.rehabPatientID) {
            return res.status(403).json({ message: 'Not authorized to complete this exercise' });
        }

        // Check if all sets are already completed
        if (exercise.completedSets.length >= exercise.numberOfSets) {
            return res.status(400).json({ message: 'All sets already completed for today' });
        }

        const setNumber = exercise.completedSets.length + 1;

        // Add the completed set
        exercise.completedSets.push({
            setNumber,
            confidenceScore: confidenceScore || 50, // Default hardcoded value
            completedAt: new Date()
        });

        exercise.lastUpdated = Date.now();
        await exercise.save();

        // Also update/create today's progress log
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let progressLog = await ProgressLog.findOne({
            rehabPatientID: exercise.rehabPatientID,
            visitDate: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (!progressLog) {
            progressLog = new ProgressLog({
                rehabPatientID: exercise.rehabPatientID,
                visitDate: today,
                exercisePerformance: []
            });
        }

        // Find or create exercise performance entry
        let exPerf = progressLog.exercisePerformance.find(
            ep => ep.exerciseId.toString() === exercise._id.toString()
        );

        if (!exPerf) {
            progressLog.exercisePerformance.push({
                exerciseId: exercise._id,
                exerciseName: exercise.exerciseName,
                sets: [{
                    setNumber,
                    confidenceScore: confidenceScore || 50
                }]
            });
        } else {
            exPerf.sets.push({
                setNumber,
                confidenceScore: confidenceScore || 50
            });
        }

        await progressLog.save();

        res.json({
            success: true,
            data: exercise,
            message: `Set ${setNumber} completed with confidence score ${confidenceScore || 50}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete exercise
// @route   DELETE /api/exercises/:id
// @access  Private (Doctor)
exports.deleteExercise = async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Verify ownership
        const profile = await RehabProfile.findOne({ rehabPatientID: exercise.rehabPatientID, assignedDoctorID: req.user.doctorId });
        if (!profile) {
            return res.status(403).json({ message: 'Not authorized to delete this exercise' });
        }

        await Exercise.deleteOne({ _id: req.params.id });

        res.json({ success: true, message: 'Exercise deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get exercise performance history for a patient (for charts)
// @route   GET /api/exercises/:rehabPatientID/performance
// @access  Private (Doctor/Patient)
exports.getExercisePerformance = async (req, res) => {
    try {
        const { rehabPatientID } = req.params;
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

// @desc    Proxy to fetch OpenCV result from local backend to bypass CORS
// @route   GET /api/exercises/proxy/result
// @access  Private (Patient/Doctor)
exports.proxyOpenCVResult = async (req, res) => {
    try {
        // Hardcoded external backend URL (User's IP)
        const OPENCV_BACKEND_URL = 'http://localhost:8000';

        console.log(`[PROXY] Fetching result from ${OPENCV_BACKEND_URL}/result`);

        const response = await axios.get(`${OPENCV_BACKEND_URL}/result`);

        console.log('[PROXY] Response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('[PROXY ERROR]', error.code, error.message);

        // Handle if backend is offline
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return res.status(503).json({
                status: 'error',
                message: 'Camera backend unreachable'
            });
        }

        res.status(500).json({ message: 'Proxy Error', error: error.message });
    }
};
