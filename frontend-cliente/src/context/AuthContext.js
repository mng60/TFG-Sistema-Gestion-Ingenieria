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
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const clienteGuardado = authService.getCurrentCliente();
    if (clienteGuardado && authService.isAuthenticated()) {
      setCliente(clienteGuardado);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setCliente(data.cliente);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setCliente(null);
  };

  const actualizarPerfil = async () => {
    try {
      const perfilActualizado = await authService.getPerfil();
      setCliente(perfilActualizado);
      return perfilActualizado;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    cliente,
    login,
    logout,
    actualizarPerfil,
    isAuthenticated: !!cliente
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
        Cargando...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};