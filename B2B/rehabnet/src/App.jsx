import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PatientLogin from './pages/PatientLogin';
import Dashboard from './pages/Dashboard';
import PatientDashboard from './pages/PatientDashboard';
import ExercisePage from './pages/ExercisePage';

import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/patient-login" element={<PatientLogin />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exercises/:patientId" element={<ExercisePage />} />
        </Route>

        {/* Patient Route - add specific protection later if needed, now relies on localStorage check in component */}
        <Route path="/patient-dashboard" element={<PatientDashboard />} />

        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
