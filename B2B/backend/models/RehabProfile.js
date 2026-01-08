const mongoose = require('mongoose');

const rehabProfileSchema = new mongoose.Schema({
    rehabPatientID: {
        type: String,
        required: true,
        index: true,
        ref: 'Patient' // Manual reference if needed, keeping string as per requirement
    },
    primaryDiagnosis: {
        type: String
    },
    rehabStartDate: {
        type: Date
    },
    rehabEndDate: {
        type: Date
    },
    assignedDoctorID: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Active", "Completed", "Paused", "Discharged"],
        default: "Active"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RehabProfile', rehabProfileSchema);
