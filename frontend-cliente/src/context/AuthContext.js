import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
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
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    // Verificar si hay sesión guardada
    const clienteGuardado = authService.getCurrentCliente();
    if (clienteGuardado && authService.isAuthenticated()) {
      setCliente(clienteGuardado);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!cliente) {
      setSocket(prev => {
        if (prev) prev.close();
        return null;
      });
      setOnlineUsers(new Set());
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    newSocket.on('online_users', (keys) => {
      setOnlineUsers(new Set(keys));
    });

    newSocket.on('user_online', ({ userId, tipoUsuario }) => {
      setOnlineUsers(prev => new Set([...prev, `${userId}_${tipoUsuario}`]));
    });

    newSocket.on('user_offline', ({ userId, tipoUsuario }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(`${userId}_${tipoUsuario}`);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [cliente?.id]);

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

  const actualizarCliente = (data) => {
    const updated = { ...(authService.getCurrentCliente() || {}), ...data };
    localStorage.setItem('cliente', JSON.stringify(updated));
    setCliente(updated);
  };

  const value = {
    cliente,
    login,
    logout,
    actualizarPerfil,
    actualizarCliente,
    loading,
    socket,
    onlineUsers,
    isAuthenticated: !!cliente
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
