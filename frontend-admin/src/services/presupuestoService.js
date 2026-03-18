import api from './api';

const presupuestoService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/presupuestos${params ? '?' + params : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/presupuestos/${id}`);
    return response.data;
  },

  getByProyecto: async (proyectoId) => {
    const response = await api.get(`/presupuestos/proyecto/${proyectoId}`);
    return response.data;
  },

  create: async (presupuestoData) => {
    const response = await api.post('/presupuestos', presupuestoData);
    return response.data;
  },

  update: async (id, presupuestoData) => {
    const response = await api.put(`/presupuestos/${id}`, presupuestoData);
    return response.data;
  },

  aceptar: async (id) => {
    const response = await api.patch(`/presupuestos/${id}/aceptar`);
    return response.data;
  },

  rechazar: async (id) => {
    const response = await api.patch(`/presupuestos/${id}/rechazar`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/presupuestos/${id}`);
    return response.data;
  }
};

export default presupuestoService;
