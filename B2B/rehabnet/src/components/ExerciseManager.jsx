import { useState, useEffect } from 'react';
import api from '../utils/api';
import './ExerciseManager.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const EXERCISE_OPTIONS = ['Tree Pose'];

const ExerciseManager = ({ patient, onBack }) => {
    const [exercises, setExercises] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingExerciseId, setEditingExerciseId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        exerciseName: 'Tree Pose',
        numberOfSets: 3,
        timePerSet: 30,
        confidenceThreshold: 70
    });

    useEffect(() => {
        fetchExercises();
        fetchPerformance();
    }, [patient.rehabPatientID]);

    const fetchExercises = async () => {
        try {
            const res = await api.get(`/exercises/${patient.rehabPatientID}`);
            if (res.data.success) {
                setExercises(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch exercises', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformance = async () => {
        try {
            const res = await api.get(`/exercises/${patient.rehabPatientID}/performance`);
            if (res.data.success) {
                setPerformanceData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch performance data', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        });
    };

    const resetForm = () => {
        setFormData({
            exerciseName: 'Tree Pose',
            numberOfSets: 3,
            timePerSet: 30,
            confidenceThreshold: 70
        });
        setEditingExerciseId(null);
        setShowForm(false);
    };

    const handleEditClick = (exercise) => {
        setEditingExerciseId(exercise._id);
        setFormData({
            exerciseName: exercise.exerciseName,
            numberOfSets: exercise.numberOfSets,
            timePerSet: exercise.timePerSet,
            confidenceThreshold: exercise.confidenceThreshold
        });
        setShowForm(true);
        window.scrollTo(0, 0);
    };

    const handleAddClick = () => {
        setEditingExerciseId(null);
        resetForm();
        setShowForm(!showForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingExerciseId) {
                await api.put(`/exercises/${editingExerciseId}`, formData);
            } else {
                await api.post('/exercises', {
                    rehabPatientID: patient.rehabPatientID,
                    ...formData
                });
            }
            resetForm();
            fetchExercises();
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this exercise assignment?')) {
            try {
                await api.delete(`/exercises/${id}`);
                fetchExercises();
            } catch (err) {
                alert('Delete failed');
            }
        }
    };

    // Prepare chart data for a specific exercise
    const getChartDataForExercise = (exerciseId, exerciseName) => {
        // Collect all sets from all days for this exercise
        const allSets = [];
        performanceData.forEach(log => {
            const exPerf = log.exercisePerformance?.find(
                ep => ep.exerciseId === exerciseId || ep.exerciseName === exerciseName
            );
            if (exPerf) {
                exPerf.sets.forEach(set => {
                    allSets.push({
                        date: new Date(log.visitDate).toLocaleDateString(),
                        setNumber: set.setNumber,
                        confidenceScore: set.confidenceScore
                    });
                });
            }
        });

        // Sort sets by date then setNumber
        allSets.sort((a, b) => {
            if (a.date === b.date) {
                return a.setNumber - b.setNumber;
            }
            return new Date(a.date) - new Date(b.date);
        });

        // Create labels and data
        const labels = allSets.map((s, i) => `Set ${s.setNumber} (${s.date})`);
        const data = allSets.map(s => s.confidenceScore);

        return {
            labels,
            datasets: [
                {
                    label: 'Confidence Score',
                    data,
                    backgroundColor: data.map(score =>
                        score >= 70 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                    ),
                    borderColor: data.map(score =>
                        score >= 70 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                    ),
                    borderWidth: 1
                }
            ]
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Set-wise Confidence Scores' }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Confidence (%)' }
            }
        }
    };

    return (
        <div className="exercise-manager">
            <div className="exercise-header">
                <button onClick={onBack} className="back-btn">&larr; Back to Patients</button>
                <h2>Assign Exercises for {patient.username}</h2>
            </div>

            <div className="exercise-controls">
                <button onClick={handleAddClick} className="add-btn">
                    {showForm && !editingExerciseId ? 'Cancel' : (editingExerciseId ? 'Cancel Edit' : '+ Add Exercise')}
                </button>
            </div>

            {showForm && (
                <div className="add-exercise-form">
                    <h3>{editingExerciseId ? 'Edit Exercise' : 'New Exercise Assignment'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Exercise</label>
                            <select
                                name="exerciseName"
                                value={formData.exerciseName}
                                onChange={handleInputChange}
                                required
                            >
                                {EXERCISE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Number of Sets</label>
                                <input
                                    type="number"
                                    name="numberOfSets"
                                    value={formData.numberOfSets}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="10"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Time per Set (seconds)</label>
                                <input
                                    type="number"
                                    name="timePerSet"
                                    value={formData.timePerSet}
                                    onChange={handleInputChange}
                                    min="5"
                                    max="300"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confidence Threshold (1-100)</label>
                            <input
                                type="number"
                                name="confidenceThreshold"
                                value={formData.confidenceThreshold}
                                onChange={handleInputChange}
                                min="1"
                                max="100"
                                required
                            />
                        </div>
                        <button type="submit" className="save-btn">
                            {editingExerciseId ? 'Update Exercise' : 'Assign Exercise'}
                        </button>
                    </form>
                </div>
            )}

            <div className="exercises-list">
                {loading ? <p>Loading...</p> : exercises.length === 0 ? <p>No exercises assigned yet.</p> : (
                    <div className="exercises-grid">
                        {exercises.map(ex => (
                            <div key={ex._id} className="exercise-card">
                                <div className="card-header">
                                    <h4>{ex.exerciseName}</h4>
                                    <div>
                                        <button
                                            onClick={() => handleEditClick(ex)}
                                            style={{ marginRight: '10px', background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}
                                        >
                                            &#9998;
                                        </button>
                                        <button onClick={() => handleDelete(ex._id)} className="delete-icon">&times;</button>
                                    </div>
                                </div>
                                <div className="card-stats">
                                    <div><strong>Sets:</strong> {ex.numberOfSets}</div>
                                    <div><strong>Time/Set:</strong> {ex.timePerSet}s</div>
                                    <div><strong>Threshold:</strong> {ex.confidenceThreshold}%</div>
                                </div>
                                <div className="progress-bar-container">
                                    <small>Today: {ex.completedSets?.length || 0} / {ex.numberOfSets} sets completed</small>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${((ex.completedSets?.length || 0) / ex.numberOfSets) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {ex.completedSets?.length > 0 && (
                                    <div className="set-scores">
                                        <small>Today's Scores: </small>
                                        {ex.completedSets.map((set, i) => (
                                            <span
                                                key={i}
                                                className={`score-badge ${set.confidenceScore >= ex.confidenceThreshold ? 'pass' : 'fail'}`}
                                            >
                                                Set {set.setNumber}: {set.confidenceScore}%
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Performance Chart */}
                                <div className="chart-container" style={{ marginTop: '15px' }}>
                                    <Bar
                                        data={getChartDataForExercise(ex._id, ex.exerciseName)}
                                        options={chartOptions}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExerciseManager;
