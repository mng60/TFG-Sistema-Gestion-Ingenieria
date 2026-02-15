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

const proyectoService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    const response = await empleadoApi.get(`/proyectos${params ? '?' + params : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await empleadoApi.get(`/proyectos/${id}`);
    return response.data;
  },

  create: async (proyectoData) => {
    const response = await empleadoApi.post('/proyectos', proyectoData);
    return response.data;
  },

  update: async (id, proyectoData) => {
    const response = await empleadoApi.put(`/proyectos/${id}`, proyectoData);
    return response.data;
  },

  delete: async (id) => {
    const response = await empleadoApi.delete(`/proyectos/${id}`);
    return response.data;
  },

  asignarEmpleado: async (id, empleadoData) => {
    const response = await empleadoApi.post(`/proyectos/${id}/empleados`, empleadoData);
    return response.data;
  },

  desasignarEmpleado: async (proyectoId, userId) => {
    const response = await empleadoApi.delete(`/proyectos/${proyectoId}/empleados/${userId}`);
    return response.data;
  },

  getEmpleados: async (id) => {
    const response = await empleadoApi.get(`/proyectos/${id}/empleados`);
    return response.data;
  },

  getEstadisticas: async () => {
    const response = await empleadoApi.get('/proyectos/estadisticas');
    return response.data;
  }
};

export default proyectoService;