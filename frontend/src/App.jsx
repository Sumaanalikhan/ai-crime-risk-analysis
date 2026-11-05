import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import SafeRoutes from './pages/SafeRoutes';
import PredictRisk from './pages/PredictRisk';
import Heatmap from './pages/Heatmap';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Utility Routes - Open to everyone */}
        <Route path="/" element={<Home />} />
        <Route path="/predict" element={<PredictRisk />} />
        <Route path="/routes" element={<SafeRoutes />} />
        <Route path="/heatmap" element={<Heatmap />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Route - Only for logged-in users saving their data */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}