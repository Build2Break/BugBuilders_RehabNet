const mongoose = require('mongoose');

const setPerformanceSchema = new mongoose.Schema({
    setNumber: {
        type: Number,
        required: true
    },
    confidenceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
}, { _id: false });

const exercisePerformanceSchema = new mongoose.Schema({
    exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true
    },
    exerciseName: {
        type: String,
        required: true
    },
    sets: [setPerformanceSchema]
}, { _id: false });

const progressLogSchema = new mongoose.Schema({
    rehabPatientID: {
        type: String,
        required: true,
        index: true
    },
    visitDate: {
        type: Date,
        required: true
    },
    painLevel: {
        type: Number,
        min: 0,
        max: 10
    },
    confidenceLevel: {
        type: Number,
        min: 1,
        max: 5
    },
    // New: Daily exercise performance with confidence scores per set
    exercisePerformance: [exercisePerformanceSchema],
    completedExercises: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
    }],
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProgressLog', progressLogSchema);
