const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    doctorId: {
        type: String,
        required: [true, 'Doctor ID is required'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        default: null
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// We do NOT hash the password here automatically in a pre-save hook 
// because the user might be manually seeding the database or handling it in the controller.
// However, typically it's best practice. 
// Given the user specifically showed an existing hashed password string, 
// I will assume passwords come in either raw (needs hashing) or we compare against this hash.
// For login, we just need the schema to exist.

module.exports = mongoose.model('doctors', doctorSchema);
