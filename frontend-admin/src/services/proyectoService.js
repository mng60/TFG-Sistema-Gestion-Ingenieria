import api from './api';

const proyectoService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/proyectos${params ? '?' + params : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/proyectos/${id}`);
    return response.data;
  },

  create: async (proyectoData) => {
    const response = await api.post('/proyectos', proyectoData);
    return response.data;
  },

  update: async (id, proyectoData) => {
    const response = await api.put(`/proyectos/${id}`, proyectoData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/proyectos/${id}`);
    return response.data;
  },

  asignarEmpleado: async (id, empleadoData) => {
    const response = await api.post(`/proyectos/${id}/empleados`, empleadoData);
    return response.data;
  },

  desasignarEmpleado: async (proyectoId, userId) => {
    const response = await api.delete(`/proyectos/${proyectoId}/empleados/${userId}`);
    return response.data;
  },

  getEmpleados: async (id) => {
    const response = await api.get(`/proyectos/${id}/empleados`);
    return response.data;
  },

  getEstadisticas: async () => {
    const response = await api.get('/proyectos/estadisticas');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  }
};

export default proyectoService;
