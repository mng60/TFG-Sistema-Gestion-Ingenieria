import api from './api';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success && response.data.token) {
        localStorage.setItem('empleado_token', response.data.token);
        localStorage.setItem('empleado', JSON.stringify(response.data.user));
        return response.data;
      }
      throw new Error(response.data.message || 'Error al iniciar sesión');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  logout: () => {
    localStorage.removeItem('empleado_token');
    localStorage.removeItem('empleado');
  },

  getCurrentEmpleado: () => {
    const str = localStorage.getItem('empleado');
    return str ? JSON.parse(str) : null;
  },

  isAuthenticated: () => !!localStorage.getItem('empleado_token'),

  getToken: () => localStorage.getItem('empleado_token'),

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    if (response.data.success) {
      const stored = JSON.parse(localStorage.getItem('empleado') || '{}');
      const updated = { ...stored, ...response.data.user };
      localStorage.setItem('empleado', JSON.stringify(updated));
      return updated;
    }
  }
};

export default authService;
