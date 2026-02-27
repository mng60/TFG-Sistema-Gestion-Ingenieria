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

  getEmpleados: async (id) => {
    const response = await api.get(`/proyectos/${id}/empleados`);
    return response.data;
  },

  asignarEmpleado: async (id, empleadoData) => {
    const response = await api.post(`/proyectos/${id}/empleados`, empleadoData);
    return response.data;
  },

  desasignarEmpleado: async (proyectoId, userId) => {
    const response = await api.delete(`/proyectos/${proyectoId}/empleados/${userId}`);
    return response.data;
  }
};

export default proyectoService;
