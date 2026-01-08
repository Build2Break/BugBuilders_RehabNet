const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('../models/Doctor');
const connectDB = require('../config/db');

dotenv.config(); // Load .env from current directory

// ...

const seedDoctors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding');

        // Check if the specific doctor exists


        const exists = await Doctor.findOne({ doctorId: doctorData.doctorId });
        if (exists) {
            console.log('Doctor already exists, skipping creation.');
        } else {
            await Doctor.create(doctorData);
            console.log('Doctor Created!');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedDoctors();
