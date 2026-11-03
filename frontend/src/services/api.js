import axios from 'axios';

// This connects your frontend to your local Express server
const API = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

// This interceptor automatically attaches the user's JWT token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;