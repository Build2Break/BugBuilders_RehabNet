import { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaRedo } from 'react-icons/fa';

const ExerciseTimer = ({ exercise, onTick, onComplete }) => {
    const [seconds, setSeconds] = useState(0); // Current session seconds
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef(null);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(0);
    };

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setSeconds(prev => {
                    const next = prev + 1;
                    onTick(exercise._id, 1);

                    // Check if it just reached minTime
                    if (exercise.completedTime + 1 === exercise.minTime) {
                        onComplete({ ...exercise, completedTime: exercise.completedTime + 1 });
                    }

                    return next;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, exercise, onTick, onComplete]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = Math.min((exercise.completedTime / exercise.minTime) * 100, 100);

    return (
        <div className="timer-component">
            <div className="timer-display">
                <span className="current-session">Session: {formatTime(seconds)}</span>
                <span className="total-today">Today: {formatTime(exercise.completedTime)}</span>
            </div>

            <div className="timer-progress-container">
                <div className="timer-progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="timer-controls">
                <button onClick={toggleTimer} className={`timer-btn ${isActive ? 'pause' : 'play'}`}>
                    {isActive ? <FaPause /> : <FaPlay />}
                </button>
                <button onClick={resetTimer} className="timer-btn reset">
                    <FaRedo />
                </button>
            </div>
        </div>
    );
};

export default ExerciseTimer;
