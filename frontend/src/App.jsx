import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SafeRoutes from './pages/SafeRoutes';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/routes" element={<SafeRoutes />} />
      </Routes>
    </Router>
  );
}