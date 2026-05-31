import api from './api';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/portal/login', { email, password });
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('cliente', JSON.stringify(response.data.cliente));
        return response.data;
      }
      throw new Error(response.data.message || 'Error al iniciar sesión');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cliente');
  },

  getCurrentCliente: () => {
    const clienteStr = localStorage.getItem('cliente');
    return clienteStr ? JSON.parse(clienteStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getPerfil: async () => {
    try {
      const response = await api.get('/portal/perfil');
      if (response.data.success) {
        localStorage.setItem('cliente', JSON.stringify(response.data.cliente));
        return response.data.cliente;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  cambiarPassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/portal/cambiar-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default authService;