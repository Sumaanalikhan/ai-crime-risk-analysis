import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import SafeRoutes from './pages/SafeRoutes';
import PredictRisk from './pages/PredictRisk';
import Heatmap from './pages/Heatmap';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/routes" element={<SafeRoutes />} />
        <Route path="/predict" element={<PredictRisk />} />
        <Route path="/heatmap" element={<Heatmap />} />
      </Routes>
    </Router>
  );
}