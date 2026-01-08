import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            <header className="hero-section">
                <nav className="navbar">
                    <div className="logo">RehabNet</div>
                    <div className="nav-links">
                        <Link to="/login" className="nav-item">Doctor Login</Link>
                        <Link to="/patient-login" className="nav-item">Patient Login</Link>
                    </div>
                </nav>

                <div className="hero-content">
                    <h1>Your Journey to <span className="highlight">Recovery</span> Starts Here</h1>
                    <p>Advanced rehabilitation management connecting doctors and patients for better outcomes.</p>
                </div>
            </header>

            <section className="portal-section">
                <h2>Choose Your Portal</h2>
                <div className="portal-cards">
                    <Link to="/login" className="portal-card doctor-card">
                        <div className="card-icon">👨‍⚕️</div>
                        <h3>Doctor Portal</h3>
                        <p>Manage patients, assign exercises, and track recovery progress.</p>
                        <span className="card-link">Login as Doctor &rarr;</span>
                    </Link>

                    <Link to="/patient-login" className="portal-card patient-card">
                        <div className="card-icon">🏥</div>
                        <h3>Patient Portal</h3>
                        <p>View your exercises, log your progress, and stay connected.</p>
                        <span className="card-link">Login as Patient &rarr;</span>
                    </Link>
                </div>
            </section>

            <section className="features-section">
                <div className="feature">
                    <h3>Personalized Plans</h3>
                    <p>Tailored exercise routines designed specifically for your recovery needs.</p>
                </div>
                <div className="feature">
                    <h3>Real-time Tracking</h3>
                    <p>Monitor your progress instantly with our advanced tracking dashboard.</p>
                </div>
                <div className="feature">
                    <h3>Secure & Private</h3>
                    <p>Your health data is protected with enterprise-grade security.</p>
                </div>
            </section>

            <footer className="home-footer">
                <p>&copy; 2024 RehabNet. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
