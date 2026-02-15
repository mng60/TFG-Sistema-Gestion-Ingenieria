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

const presupuestoService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    const response = await empleadoApi.get(`/presupuestos${params ? '?' + params : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await empleadoApi.get(`/presupuestos/${id}`);
    return response.data;
  },

  getByProyecto: async (proyectoId) => {
    const response = await empleadoApi.get(`/presupuestos/proyecto/${proyectoId}`);
    return response.data;
  },

  create: async (presupuestoData) => {
    const response = await empleadoApi.post('/presupuestos', presupuestoData);
    return response.data;
  },

  update: async (id, presupuestoData) => {
    const response = await empleadoApi.put(`/presupuestos/${id}`, presupuestoData);
    return response.data;
  },

  aceptar: async (id) => {
    const response = await empleadoApi.patch(`/presupuestos/${id}/aceptar`);
    return response.data;
  },

  rechazar: async (id) => {
    const response = await empleadoApi.patch(`/presupuestos/${id}/rechazar`);
    return response.data;
  },

  delete: async (id) => {
    const response = await empleadoApi.delete(`/presupuestos/${id}`);
    return response.data;
  }
};

export default presupuestoService;