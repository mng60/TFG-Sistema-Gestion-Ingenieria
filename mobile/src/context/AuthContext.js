import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const empleadoGuardado = authService.getCurrentEmpleado();
    const token = authService.getToken();
    if (empleadoGuardado && token) {
      setEmpleado(empleadoGuardado);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setEmpleado(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setEmpleado(null);
  };

  const isAdmin = () => empleado?.rol === 'admin';

  const value = {
    empleado,
    login,
    logout,
    isAdmin,
    isAuthenticated: !!empleado
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        Cargando...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
