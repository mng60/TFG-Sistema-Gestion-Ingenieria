import axios from 'axios';

// Auto-detecta: usa env var si existe, si no usa el mismo host que la app (WiFi local)
const hostname = window.location.hostname;
const API_URL = process.env.REACT_APP_API_URL || `http://${hostname}:5000/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('empleado_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('empleado_token');
      localStorage.removeItem('empleado');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
