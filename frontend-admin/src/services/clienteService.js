import api from './api';

const clienteService = {
  getAll: async (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/clientes${params ? '?' + params : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  create: async (clienteData) => {
    const response = await api.post('/clientes', clienteData);
    return response.data;
  },

  update: async (id, clienteData) => {
    const response = await api.put(`/clientes/${id}`, clienteData);
    return response.data;
  },

  deactivate: async (id) => {
    const response = await api.patch(`/clientes/${id}/deactivate`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },

  activarAcceso: async (id, password) => {
    const response = await api.post(`/clientes/${id}/activar-acceso`, { password });
    return response.data;
  },

  desactivarAcceso: async (id) => {
    const response = await api.patch(`/clientes/${id}/deactivate`);
    return response.data;
  }
};

export default clienteService;
