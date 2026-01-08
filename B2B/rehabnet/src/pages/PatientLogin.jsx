import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './PatientLogin.css';

const PatientLogin = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [error, setError] = useState('');
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await api.post('/patients/login', formData);
            if (res.data.success) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('patient', JSON.stringify(res.data.patient));
                localStorage.removeItem('doctor');
                navigate('/patient-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/patients/forgot-password', { email: forgotEmail });
            alert('Password reset link sent to ' + forgotEmail);
            setShowForgot(false);
            setForgotEmail('');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send reset email');
        }
    };

    return (
        <div className="patient-login-container">
            <div className="login-card">
                <h2>Patient Portal Login</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username or Mobile Number</label>
                        <input
                            type="text"
                            name="identifier"
                            value={formData.identifier}
                            onChange={handleChange}
                            placeholder="Enter username or mobile"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button type="submit" className="login-btn">Login</button>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Forgot Password?
                        </button>
                    </div>
                </form>
            </div>

            {showForgot && (
                <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
                        <h3>Reset Password</h3>
                        <p style={{ marginBottom: '1rem', color: '#666' }}>Enter your registered email address to receive a reset link.</p>
                        <form onSubmit={handleForgotSubmit}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required
                                    placeholder="e.g. your@email.com"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowForgot(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Send Link</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientLogin;
