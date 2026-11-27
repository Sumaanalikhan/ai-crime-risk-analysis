export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const ENDPOINTS = {
  HEATMAP: `${API_BASE_URL}/api/heatmap`,
  PREDICT: `${API_BASE_URL}/api/predict`,
};