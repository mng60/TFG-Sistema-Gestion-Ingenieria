import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const empleadoApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

empleadoApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('empleado_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const usuarioService = {
  getAll: async () => {
    const response = await empleadoApi.get('/users');
    return response.data;
  },

  getById: async (id) => {
    const response = await empleadoApi.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await empleadoApi.post('/users', userData);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await empleadoApi.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await empleadoApi.delete(`/users/${id}`);
    return response.data;
  },

  cambiarPassword: async (id, passwords) => {
    const response = await empleadoApi.put(`/users/${id}/password`, passwords);
    return response.data;
  }
};

export default usuarioService;