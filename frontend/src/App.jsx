import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* The Dashboard is now our default home page */}
        <Route path="/" element={<Dashboard />} />
        
        {/* We will add the /routes and /predict pages here in our next steps! */}
      </Routes>
    </Router>
  );
}