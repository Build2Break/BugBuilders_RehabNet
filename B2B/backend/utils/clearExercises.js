const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear exercises collection
        const exResult = await mongoose.connection.db.collection('exercises').deleteMany({});
        console.log(`Deleted ${exResult.deletedCount} exercises`);

        // Clear progress logs collection
        const logResult = await mongoose.connection.db.collection('progresslogs').deleteMany({});
        console.log(`Deleted ${logResult.deletedCount} progress logs`);

        console.log('Cleanup complete! You can now assign fresh exercises.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

connectDB();
