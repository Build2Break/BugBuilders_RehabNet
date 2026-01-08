const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('./models/Doctor');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

const runVerification = async () => {
    try {
        console.log('Starting Verification...');

        // 1. Setup - Ensure DB connected (for creating doctor if needed)
        // We will skip direct DB manipulation if we can, but we need a doctor.
        // Let's assume we can login with the seeded doctor or creating one.
        // Verify doctor data from seeder? Or just creating a temp one via DB directly

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for setup');

        const testDoctorId = 'TD99';
        const testDoctorPwd = 'password123';

        // Remove existing test doctor/patient for clean run
        await Doctor.deleteOne({ doctorId: testDoctorId });
        await mongoose.connection.collection('patients').deleteMany({ username: 'testpatient' });

        // Create Test Doctor
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testDoctorPwd, salt);

        await Doctor.create({
            doctorId: testDoctorId,
            password: hashedPassword,
            name: 'Test Doctor',
            isActive: true
        });
        console.log('Test Doctor Created');

        // 2. Login Doctor
        console.log('Logging in Doctor...');
        const doctorLogin = await axios.post(`${API_URL}/auth/login`, {
            doctorId: testDoctorId,
            password: testDoctorPwd
        });
        const doctorToken = doctorLogin.data.token;
        console.log('Doctor Logged In. Token acquired.');

        const doctorHeaders = { headers: { Authorization: `Bearer ${doctorToken}` } };

        // 3. Create Patient
        console.log('Creating Patient...');
        const patientData = {
            hospitalPatientID: 'HP123',
            username: 'testpatient',
            mobileNumber: '9999999999',
            password: 'patientpass',
            primaryDiagnosis: 'ACL Tear',
            rehabStartDate: new Date(),
            rehabEndDate: new Date(new Date().setDate(new Date().getDate() + 30))
        };

        const createPatientRes = await axios.post(`${API_URL}/patients`, patientData, doctorHeaders);
        const patientParams = createPatientRes.data.data.patient;
        console.log(`Patient Created: ${patientParams.rehabPatientID}`);

        // 4. Login Patient
        console.log('Logging in Patient...');
        const patientLogin = await axios.post(`${API_URL}/patients/login`, {
            identifier: 'testpatient',
            password: 'patientpass'
        });
        const patientToken = patientLogin.data.token;
        console.log('Patient Logged In. Token acquired.');

        // 5. Assign Exercise (Doctor)
        console.log('Assigning Exercise...');
        const exerciseData = {
            rehabPatientID: patientParams.rehabPatientID,
            exerciseName: 'Squats',
            minReps: 5,
            maxReps: 15,
            minSets: 1,
            maxSets: 3
        };
        const exerciseRes = await axios.post(`${API_URL}/exercises`, exerciseData, doctorHeaders);
        const exerciseId = exerciseRes.data.data._id;
        console.log('Exercise Assigned');

        // 6. Log Progress (Patient) -> Using PUT /exercises/:id
        // NOTE: My PatientDashboard implementation updates `completedSets` and implicitly `completedReps`.
        // Let's simulate completing 1 set.
        console.log('Patient logging progress...');
        const patientHeaders = { headers: { Authorization: `Bearer ${patientToken}` } };

        // Fetch current to get latest
        const exFetch = await axios.get(`${API_URL}/exercises/${patientParams.rehabPatientID}`, patientHeaders);
        const myEx = exFetch.data.data.find(e => e._id === exerciseId);

        const updateData = {
            completedSets: myEx.completedSets + 1,
            completedReps: myEx.completedReps + myEx.minReps
        };

        await axios.put(`${API_URL}/exercises/${exerciseId}`, updateData, patientHeaders);
        console.log('Progress Logged (Set 1)');

        // 7. Verify Constraints (Try to exceed max sets)
        console.log('Verifying Constraints...');
        try {
            // Max sets is 3. We are at 1. Let's try to set to 4.
            await axios.put(`${API_URL}/exercises/${exerciseId}`, {
                completedSets: 4,
                completedReps: 50 // some high number
            }, patientHeaders);
            console.error('ERROR: Constraint Check Failed - Should have rejected exceeding max sets');
        } catch (err) {
            console.log('Constraint Check Passed: ' + (err.response?.data?.message || err.message));
        }

        console.log('VERIFICATION COMPLETE');
        process.exit(0);

    } catch (error) {
        console.error('Verification Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
};

runVerification();
