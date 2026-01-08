import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(JSON.parse(localStorage.getItem('doctor') || '{}'));
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI State
    const [showModal, setShowModal] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);

    // Form State (for both add and edit)
    const [formData, setFormData] = useState({
        hospitalPatientID: '',
        username: '',
        mobileNumber: '',
        email: '',
        primaryDiagnosis: '',
        rehabStartDate: '',
        rehabEndDate: '',
    });

    // OTP Verification State
    const [otpState, setOtpState] = useState({
        sent: false,
        verified: false,
        verificationToken: null,
        otp: '',
        sending: false,
        verifying: false,
        error: ''
    });

    // State for viewing generated password
    const [generatedPassword, setGeneratedPassword] = useState(null);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        } else {
            fetchPatients();
        }
    }, [navigate]);

    const fetchPatients = async () => {
        try {
            const res = await api.get('/patients');
            if (res.data.success) {
                setPatients(res.data.data);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) handleLogout();
            setError('Failed to fetch patients');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('doctor');
        navigate('/login');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Reset OTP state if email changes
        if (name === 'email' && otpState.sent) {
            setOtpState({
                sent: false,
                verified: false,
                verificationToken: null,
                otp: '',
                sending: false,
                verifying: false,
                error: ''
            });
        }
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtpState({ ...otpState, otp: value, error: '' });
    };

    const sendOtp = async () => {
        if (!formData.email) {
            setOtpState({ ...otpState, error: 'Please enter an email first' });
            return;
        }

        setOtpState({ ...otpState, sending: true, error: '' });

        try {
            const res = await api.post('/otp/send', { email: formData.email });
            if (res.data.success) {
                setOtpState({
                    ...otpState,
                    sent: true,
                    sending: false,
                    error: ''
                });
            }
        } catch (err) {
            setOtpState({
                ...otpState,
                sending: false,
                error: err.response?.data?.message || 'Failed to send OTP'
            });
        }
    };

    const verifyOtp = async () => {
        if (!otpState.otp || otpState.otp.length !== 6) {
            setOtpState({ ...otpState, error: 'Please enter a valid 6-digit OTP' });
            return;
        }

        setOtpState({ ...otpState, verifying: true, error: '' });

        try {
            const res = await api.post('/otp/verify', {
                email: formData.email,
                otp: otpState.otp
            });
            if (res.data.success) {
                setOtpState({
                    ...otpState,
                    verified: true,
                    verifying: false,
                    verificationToken: res.data.verificationToken,
                    error: ''
                });
            }
        } catch (err) {
            setOtpState({
                ...otpState,
                verifying: false,
                error: err.response?.data?.message || 'Invalid OTP'
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPatient) {
                await api.put(`/patients/${editingPatient._id}`, formData);
                setEditingPatient(null);
                setShowModal(false);
                resetForm();
            } else {
                // For new patient, require email verification
                if (!otpState.verified || !otpState.verificationToken) {
                    alert('Please verify the patient email before saving.');
                    return;
                }

                const res = await api.post('/patients', {
                    ...formData,
                    verificationToken: otpState.verificationToken
                });
                if (res.data.success && res.data.data.generatedPassword) {
                    setGeneratedPassword(res.data.data.generatedPassword);
                    setShowModal(false);
                }
            }
            fetchPatients();
        } catch (err) {
            alert(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
            try {
                await api.delete(`/patients/${id}`);
                fetchPatients();
            } catch (err) {
                alert('Delete failed');
            }
        }
    };

    const openEditModal = (patient) => {
        setEditingPatient(patient);
        setFormData({
            hospitalPatientID: patient.hospitalPatientID,
            username: patient.username,
            mobileNumber: patient.mobileNumber,
            email: patient.email || '', // Handle legacy data
            primaryDiagnosis: patient.profile?.primaryDiagnosis || '',
            rehabStartDate: patient.profile?.rehabStartDate ? patient.profile.rehabStartDate.split('T')[0] : '',
            rehabEndDate: patient.profile?.rehabEndDate ? patient.profile.rehabEndDate.split('T')[0] : ''
        });
        // No OTP verification needed for editing
        setOtpState({
            sent: false,
            verified: true, // Skip verification for edit mode
            verificationToken: null,
            otp: '',
            sending: false,
            verifying: false,
            error: ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            hospitalPatientID: '',
            username: '',
            mobileNumber: '',
            email: '',
            primaryDiagnosis: '',
            rehabStartDate: '',
            rehabEndDate: ''
        });
        setOtpState({
            sent: false,
            verified: false,
            verificationToken: null,
            otp: '',
            sending: false,
            verifying: false,
            error: ''
        });
    }

    const openAddModal = () => {
        setEditingPatient(null);
        resetForm();
        setShowModal(true);
    };

    if (loading) return <div>Loading...</div>;



    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Doctor Dashboard</h1>
                <div className="user-info">
                    <span>Dr. {doctor.name || doctor.doctorId}</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="actions-bar">
                    <h2>My Patients</h2>
                    <button onClick={openAddModal} className="add-btn">+ Add Patient</button>
                </div>

                {error && <div className="error">{error}</div>}

                <div className="patients-table-container">
                    <table className="patients-table">
                        <thead>
                            <tr>
                                <th>Name/Hospital ID</th>
                                <th>Rehab ID</th>
                                <th>Mobile</th>
                                <th>Diagnosis</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map(patient => (
                                <tr key={patient._id}>
                                    <td>
                                        <div className="fw-bold">{patient.username}</div>
                                        <div className="text-secondary">{patient.hospitalPatientID}</div>
                                    </td>
                                    <td>{patient.rehabPatientID}</td>
                                    <td>{patient.mobileNumber}</td>
                                    <td>{patient.profile?.primaryDiagnosis || 'N/A'}</td>
                                    <td>
                                        <span className={`status-badge ${patient.profile?.status?.toLowerCase()}`}>
                                            {patient.profile?.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button onClick={() => navigate(`/exercises/${patient.rehabPatientID}`)}>Exercises</button>
                                        <button onClick={() => openEditModal(patient)}>Edit</button>
                                        <button onClick={() => handleDelete(patient._id)} className="delete-btn">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Hospital ID</label>
                                    <input name="hospitalPatientID" value={formData.hospitalPatientID} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Username</label>
                                    <input name="username" value={formData.username} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>
                                        Email
                                        {!editingPatient && otpState.verified && (
                                            <span className="verified-badge">✓ Verified</span>
                                        )}
                                    </label>
                                    <div className="email-input-group">
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            disabled={!editingPatient && otpState.verified}
                                            className={!editingPatient && otpState.verified ? 'verified-input' : ''}
                                        />
                                        {!editingPatient && !otpState.verified && (
                                            <button
                                                type="button"
                                                onClick={sendOtp}
                                                className="otp-btn send-otp-btn"
                                                disabled={otpState.sending || !formData.email}
                                            >
                                                {otpState.sending ? 'Sending...' : otpState.sent ? 'Resend' : 'Send OTP'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* OTP Input Section - Only show for new patients when OTP sent but not verified */}
                            {!editingPatient && otpState.sent && !otpState.verified && (
                                <div className="otp-section">
                                    <div className="otp-input-group">
                                        <label>Enter OTP sent to {formData.email}</label>
                                        <div className="otp-verify-row">
                                            <input
                                                type="text"
                                                placeholder="Enter 6-digit OTP"
                                                value={otpState.otp}
                                                onChange={handleOtpChange}
                                                maxLength={6}
                                                className="otp-input"
                                            />
                                            <button
                                                type="button"
                                                onClick={verifyOtp}
                                                className="otp-btn verify-otp-btn"
                                                disabled={otpState.verifying || otpState.otp.length !== 6}
                                            >
                                                {otpState.verifying ? 'Verifying...' : 'Verify'}
                                            </button>
                                        </div>
                                        {otpState.error && <div className="otp-error">{otpState.error}</div>}
                                        <p className="otp-hint">Check the server console for the OTP code (development mode)</p>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Primary Diagnosis</label>
                                <input name="primaryDiagnosis" value={formData.primaryDiagnosis} onChange={handleInputChange} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" name="rehabStartDate" value={formData.rehabStartDate} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" name="rehabEndDate" value={formData.rehabEndDate} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={!editingPatient && !otpState.verified}
                                >
                                    {!editingPatient && !otpState.verified ? 'Verify Email First' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {
                generatedPassword && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ textAlign: 'center' }}>
                            <h3>Patient Created Successfully!</h3>
                            <p>Share this one-time password with the patient:</p>
                            <div style={{ background: '#f0f9ff', padding: '15px', fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', color: '#0ea5e9', margin: '20px 0', borderRadius: '8px', border: '1px dashed #0ea5e9' }}>
                                {generatedPassword}
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#666' }}>They can use this to log in immediately.</p>
                            <button onClick={() => { setGeneratedPassword(null); resetForm(); }} className="save-btn" style={{ width: '100%' }}>Done</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;

