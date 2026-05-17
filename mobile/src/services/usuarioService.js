import api from './api';

const usuarioService = {
  getEmpleadosChat: async () => {
    const response = await api.get('/users/empleados-chat');
    return response.data;
  }
};

export default usuarioService;
