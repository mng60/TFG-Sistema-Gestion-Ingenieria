import React, { createContext, useState, useContext, useEffect } from 'react';
import empleadoAuthService from '../services/empleadoAuthService';

const EmpleadoAuthContext = createContext();

export const useEmpleadoAuth = () => {
  const context = useContext(EmpleadoAuthContext);
  if (!context) {
    throw new Error('useEmpleadoAuth debe usarse dentro de EmpleadoAuthProvider');
  }
  return context;
};

export const EmpleadoAuthProvider = ({ children }) => {
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Siempre pedir login
    setEmpleado(null);
    setLoading(false);
    
    // Limpiar sesión al cargar
    localStorage.removeItem('empleado_token');
    localStorage.removeItem('empleado');
  }, []);

  const login = async (email, password) => {
    try {
      const data = await empleadoAuthService.login(email, password);
      setEmpleado(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    empleadoAuthService.logout();
    setEmpleado(null);
  };

  const isAdmin = () => {
    return empleado?.rol === 'admin';
  };

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
        fontSize: '1.5rem'
      }}>
        Cargando sistema...
      </div>
    );
  }

  return <EmpleadoAuthContext.Provider value={value}>{children}</EmpleadoAuthContext.Provider>;
};