const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('../models/Doctor');

// Load env vars
dotenv.config(); // Load .env from current directory (where script is run from)

const debugDB = async () => {
    try {
        console.log('Attempting to connect to:', process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in DB:', collections.map(c => c.name));

        // Fetch ALL doctors
        const allDoctors = await Doctor.find({});
        console.log(`Found ${allDoctors.length} doctors.`);
        console.dir(allDoctors, { depth: null });

        // Specific check
        const docId = "doc444";
        const doc = await Doctor.findOne({ doctorId: docId });
        console.log(`Direct query for ${docId}:`, doc ? 'FOUND' : 'NOT FOUND');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugDB();
