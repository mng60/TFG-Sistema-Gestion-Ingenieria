import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crear instancia específica para empleados
const empleadoApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para token de empleado
empleadoApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('empleado_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const clienteService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    const response = await empleadoApi.get(`/clientes${params ? '?' + params : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await empleadoApi.get(`/clientes/${id}`);
    return response.data;
  },

  create: async (clienteData) => {
    const response = await empleadoApi.post('/clientes', clienteData);
    return response.data;
  },

  update: async (id, clienteData) => {
    const response = await empleadoApi.put(`/clientes/${id}`, clienteData);
    return response.data;
  },

  deactivate: async (id) => {
    const response = await empleadoApi.patch(`/clientes/${id}/deactivate`);
    return response.data;
  },

  delete: async (id) => {
    const response = await empleadoApi.delete(`/clientes/${id}`);
    return response.data;
  },

  activarAcceso: async (id, password) => {
    const response = await empleadoApi.post(`/clientes/${id}/activar-acceso`, { password });
    return response.data;
  }
};

export default clienteService;