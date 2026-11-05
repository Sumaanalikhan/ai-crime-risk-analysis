import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  // Check if the user has a JWT token saved
  const isAuthenticated = !!localStorage.getItem('token');

  // If they don't have a token, kick them back to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If they do have a token, allow them to view the Dashboard
  return children;
}