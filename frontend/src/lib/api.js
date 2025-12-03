import axios from 'axios';

// Support both VITE_API_URL and VITE_API_BASE for backward compatibility
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE,
});

// Export API_BASE for use in OAuth links and other direct URL needs
export { API_BASE };

// Ensure token is always sent from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuth(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('token');
  }
}
