import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './PatientDashboard.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { FaFire, FaUser, FaQuoteLeft, FaTrophy, FaCheckCircle, FaStar, FaPlay, FaSpinner } from 'react-icons/fa';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const QUOTES = [
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Don't watch the clock; do what it does. Keep going.",
    "Recovery is a marathon, not a sprint.",
    "Every step forward is a victory."
];

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(JSON.parse(localStorage.getItem('patient') || '{}'));
    const [exercises, setExercises] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(patient.streak || 0);
    const [activeExercise, setActiveExercise] = useState(null); // Currently running exercise
    const [countdown, setCountdown] = useState(0);
    const isCompletingRef = useRef(false); // Prevent double API calls
    const timerRef = useRef(null); // Store timer reference

    const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    // Daily Log State
    const [dailyLog, setDailyLog] = useState({
        painLevel: 5,
        confidenceLevel: 3,
        notes: ''
    });

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/patient-login');
        } else {
            fetchData();
        }
    }, [navigate]);

    const fetchData = async () => {
        try {
            // 1. Get Exercises
            const exRes = await api.get(`/exercises/${patient.rehabPatientID}`);
            if (exRes.data.success) {
                setExercises(exRes.data.data);
            }

            // 2. Get Performance History
            const perfRes = await api.get(`/exercises/${patient.rehabPatientID}/performance`);
            if (perfRes.data.success) {
                setPerformanceData(perfRes.data.data);
            }

            // 3. Get Patient Stats (Streak)
            const profileRes = await api.get('/patients/me');
            if (profileRes.data.success) {
                const freshPatient = profileRes.data.data;
                setPatient(freshPatient);
                setStreak(freshPatient.streak || 0);
                localStorage.setItem('patient', JSON.stringify(freshPatient));
            }

        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('patient');
        navigate('/patient-login');
    };

    const OPENCV_BACKEND_URL = 'http://localhost:8000';
    const [videoStreamUrl, setVideoStreamUrl] = useState(null);

    // Start an exercise set - OpenCV Integration
    const startExerciseSet = async (exercise) => {
        if (activeExercise || isCompletingRef.current) return; // Already running

        const completedCount = exercise.completedSets?.length || 0;
        if (completedCount >= exercise.numberOfSets) {
            alert('All sets completed for today!');
            return;
        }

        setActiveExercise(exercise._id);
        setCountdown(exercise.timePerSet);

        // Start Video Stream
        setVideoStreamUrl(`${OPENCV_BACKEND_URL}/video?duration=${exercise.timePerSet}`);

        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        let timeLeft = exercise.timePerSet;

        // Countdown timer (Visual only, sync with backend duration)
        timerRef.current = setInterval(() => {
            timeLeft -= 1;
            setCountdown(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                // Time's up - Fetch result from OpenCV backend
                completeSet(exercise._id);
            }
        }, 1000);
    };

    const completeSet = async (exerciseId) => {
        // Prevent duplicate calls
        if (isCompletingRef.current) return;
        isCompletingRef.current = true;

        try {
            // Fetch Result from OpenCV Backend with Retry Logic
            let confidenceScore = 0;
            let retries = 3;
            let success = false;

            while (retries > 0 && !success) {
                try {
                    console.log(`[Attempt ${4 - retries}] Fetching result directly from OpenCV backend...`);

                    // Direct fetch as requested
                    const cvRes = await fetch(`${OPENCV_BACKEND_URL}/result`);
                    if (!cvRes.ok) throw new Error(`Status: ${cvRes.status}`);
                    const cvData = await cvRes.json();

                    console.log('OpenCV Backend Response:', cvData);

                    // Check if status is "running" (if applicable) or if we have a score
                    if (cvData.average_pose_score !== undefined) {
                        confidenceScore = Math.round(cvData.average_pose_score);
                        success = true;
                    } else if (cvData.status === 'running') {
                        // Wait a bit and retry
                        console.log('Backend still processing, waiting...');
                        await new Promise(r => setTimeout(r, 1000));
                    } else {
                        console.warn('Unknown response format:', cvData);
                        break;
                    }
                } catch (cvErr) {
                    console.error(`Fetch attempt failed: ${cvErr.message}`);
                    await new Promise(r => setTimeout(r, 1000)); // Wait before retry
                }
                retries--;
            }

            if (!success) {
                alert(`Could not Retrieve Result.\nCheck Console (F12) for detailed error.\nEnsure ${OPENCV_BACKEND_URL} is reachable.`);
            }

            const res = await api.post(`/exercises/${exerciseId}/complete-set`, {
                confidenceScore
            });

            if (res.data.success) {
                // Refresh data
                fetchData();
            }
        } catch (err) {
            console.error('Failed to complete set', err);
            alert(err.response?.data?.message || 'Failed to record set');
        } finally {
            setActiveExercise(null);
            setCountdown(0);
            setVideoStreamUrl(null); // Stop displaying video
            isCompletingRef.current = false;
        }
    };

    const submitDailylog = async () => {
        try {
            await api.post('/progress', {
                rehabPatientID: patient.rehabPatientID,
                date: new Date(),
                painLevel: dailyLog.painLevel,
                confidenceLevel: dailyLog.confidenceLevel,
                notes: dailyLog.notes
            });

            alert("Daily Progress Logged!");
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    // Get chart data for a specific exercise
    const getChartDataForExercise = (exerciseId, exerciseName) => {
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

        // Sort sets by setNumber to ensure correct order
        allSets.sort((a, b) => a.setNumber - b.setNumber);

        const labels = allSets.map((s, i) => `Set ${s.setNumber}`);
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
            title: { display: true, text: 'Your Performance' }
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
        <div className="patient-dashboard">
            {/* Header */}
            <header className="patient-header">
                <div className="header-left">
                    <div className="avatar-icon"><FaUser /></div>
                    <div>
                        <h1>Hello, {patient.username}</h1>
                        <span className="subtitle">Ready for recovery?</span>
                    </div>
                </div>
                <div className="header-right">
                    <div className="streak-badge">
                        <FaFire className="flame-icon" />
                        <span>{streak} Day Streak</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </header>

            <main className="patient-content">
                {/* Motivational Section */}
                <section className="quote-section">
                    <FaQuoteLeft className="quote-icon" />
                    <blockquote>{quote}</blockquote>
                </section>

                <div className="dashboard-grid">
                    {/* Left Column: Exercises */}
                    <div className="exercises-section">
                        <h2>Today's Exercises</h2>
                        {loading ? <p>Loading...</p> : (
                            <div className="exercise-list">
                                {exercises.map(ex => {
                                    const completedCount = ex.completedSets?.length || 0;
                                    const isComplete = completedCount >= ex.numberOfSets;
                                    const isRunning = activeExercise === ex._id;

                                    return (
                                        <div key={ex._id} className={`p-exercise-item ${isComplete ? 'complete' : ''}`}>
                                            <div className="ex-info">
                                                <div className="ex-title-row">
                                                    <h3>{ex.exerciseName}</h3>
                                                    {isComplete && <FaCheckCircle className="done-icon" />}
                                                </div>
                                                <div className="ex-meta">
                                                    <span>Sets: {completedCount} / {ex.numberOfSets}</span>
                                                    <span style={{ marginLeft: '15px' }}>Time/Set: {ex.timePerSet}s</span>
                                                    <span style={{ marginLeft: '15px' }}>Threshold: {ex.confidenceThreshold}%</span>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="progress-bar-container" style={{ marginTop: '10px' }}>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${(completedCount / ex.numberOfSets) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Set scores */}
                                                {ex.completedSets?.length > 0 && (
                                                    <div className="set-scores" style={{ marginTop: '10px' }}>
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

                                                {/* Video Stream */}
                                                {isRunning && videoStreamUrl && (
                                                    <div className="video-stream-container" style={{ marginTop: '15px', marginBottom: '15px', textAlign: 'center' }}>
                                                        <img
                                                            src={videoStreamUrl}
                                                            alt="Live Pose Estimation"
                                                            style={{ width: '100%', maxWidth: '640px', borderRadius: '8px', border: '2px solid #22c55e' }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Start Set Button */}
                                                {!isComplete && (
                                                    <button
                                                        className={`start-set-btn ${isRunning ? 'running' : ''}`}
                                                        onClick={() => startExerciseSet(ex)}
                                                        disabled={isRunning || activeExercise}
                                                    >
                                                        {isRunning ? (
                                                            <>
                                                                <FaSpinner className="spinner" />
                                                                {countdown}s remaining...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaPlay /> Start Set {completedCount + 1}
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {isComplete && (
                                                    <div className="completion-badge">
                                                        All sets completed!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Daily Inputs */}
                        <div className="daily-inputs">
                            <h3>Daily Check-in</h3>
                            <div className="input-group">
                                <label>Confidence (1-5)</label>
                                <input
                                    type="range" min="1" max="5"
                                    value={dailyLog.confidenceLevel}
                                    onChange={(e) => setDailyLog({ ...dailyLog, confidenceLevel: parseInt(e.target.value) })}
                                />
                                <div className="stars">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < dailyLog.confidenceLevel ? 'star active' : 'star'} />
                                    ))}
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Pain Level (0-10)</label>
                                <input
                                    type="range" min="0" max="10"
                                    value={dailyLog.painLevel}
                                    onChange={(e) => setDailyLog({ ...dailyLog, painLevel: parseInt(e.target.value) })}
                                    className="pain-slider"
                                />
                                <div className="slider-value">{dailyLog.painLevel}</div>
                            </div>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Add a note about today's session..."
                                    value={dailyLog.notes}
                                    onChange={(e) => setDailyLog({ ...dailyLog, notes: e.target.value })}
                                    className="notes-input"
                                />
                            </div>
                            <button onClick={submitDailylog} className="submit-log-btn">Update Daily Log</button>
                        </div>
                    </div>

                    {/* Right Column: Performance Charts */}
                    <div className="analytics-section">
                        <h2>Your Performance</h2>
                        {exercises.map(ex => (
                            <div key={ex._id} className="chart-card" style={{ marginBottom: '20px' }}>
                                <h4>{ex.exerciseName}</h4>
                                <Bar
                                    data={getChartDataForExercise(ex._id, ex.exerciseName)}
                                    options={chartOptions}
                                />
                            </div>
                        ))}

                        <div className="best-perf-card">
                            <div className="trophy-icon"><FaTrophy /></div>
                            <div>
                                <h4>Keep Going!</h4>
                                <p>Complete all your sets today to maintain your streak!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatientDashboard;
