import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import SafeRoutes from './pages/SafeRoutes';
import PredictRisk from './pages/PredictRisk';
import Heatmap from './pages/Heatmap';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/routes" element={<SafeRoutes />} />
        <Route path="/predict" element={<PredictRisk />} />
        <Route path="/heatmap" element={<Heatmap />} />
      </Routes>
    </Router>
  );
}