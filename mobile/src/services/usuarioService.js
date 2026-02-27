import api from './api';

const usuarioService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getEmpleadosChat: async () => {
    const response = await api.get('/users/empleados-chat');
    return response.data;
  }
};

export default usuarioService;
