const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    rehabPatientID: {
        type: String,
        required: true,
        unique: true
    },
    hospitalPatientID: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    streak: {
        type: Number,
        default: 0
    },
    lastStreakUpdate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
