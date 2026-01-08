const mongoose = require('mongoose');

const completedSetSchema = new mongoose.Schema({
    setNumber: {
        type: Number,
        required: true
    },
    confidenceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const exerciseSchema = new mongoose.Schema({
    rehabPatientID: {
        type: String,
        required: true,
        index: true
    },
    exerciseName: {
        type: String,
        required: true,
        enum: ['Tree Pose'], // Only Tree Pose for now
        default: 'Tree Pose'
    },
    numberOfSets: {
        type: Number,
        required: true,
        min: 1,
        default: 3
    },
    timePerSet: {
        type: Number,
        required: true,
        min: 1, // in seconds
        default: 30
    },
    confidenceThreshold: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
        default: 70
    },
    // Today's completed sets
    completedSets: [completedSetSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exercise', exerciseSchema);
