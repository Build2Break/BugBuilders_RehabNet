import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ExerciseManager from '../components/ExerciseManager';
import api from '../utils/api';
import './ExercisePage.css';

const ExercisePage = () => {
    const { patientId } = useParams(); // This will be the _id or rehabPatientID depending on route
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We need to fetch patient details to pass to ExerciseManager
        // ExerciseManager expects { rehabPatientID, username, ... }
        // If our route uses the mongo _id, we fetch by that.
        const fetchPatient = async () => {
            try {
                // We don't have a direct get-by-id endpoint for single patient in patientController (only getPatients)
                // But getPatients returns all. We can filter or better, add a getById endpoint.
                // For now, let's reuse getPatients and find. Ideally we add getPatientById.
                // Or provided we passed state via navigate? State is lost on refresh.
                // Let's implement a quick fetch or just use the list.

                const res = await api.get('/patients');
                if (res.data.success) {
                    const found = res.data.data.find(p => p.rehabPatientID === patientId || p._id === patientId);
                    if (found) {
                        setPatient(found);
                    } else {
                        alert('Patient not found');
                        navigate('/dashboard');
                    }
                }
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    alert('Session expired. Please login again.');
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    // Don't auto-redirect, show error state
                    setLoading(false);
                    alert('Failed to load patient data: ' + (err.response?.data?.message || err.message));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPatient();
    }, [patientId, navigate]);

    if (loading) return <div style={{ padding: '2rem' }}>Loading Patient Details...</div>;
    if (!patient) return null;

    return (
        <div className="exercise-page-container">
            <ExerciseManager
                patient={patient}
                onBack={() => navigate('/dashboard')}
            />
        </div>
    );
};

export default ExercisePage;
