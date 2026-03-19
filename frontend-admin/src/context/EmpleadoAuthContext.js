import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
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
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    const empleadoGuardado = empleadoAuthService.getCurrentEmpleado();
    const token = empleadoAuthService.getToken();

    if (empleadoGuardado && token) {
      setEmpleado({ ...empleadoGuardado, tipo_usuario: 'empleado' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!empleado) {
      setSocket(prev => {
        if (prev) prev.close();
        return null;
      });
      setOnlineUsers(new Set());
      return;
    }

    const token = localStorage.getItem('empleado_token');
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
  }, [empleado?.id]);

  const login = async (email, password) => {
    try {
      const data = await empleadoAuthService.login(email, password);
      setEmpleado({ ...data.user, tipo_usuario: 'empleado' });
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

  const actualizarEmpleado = (data) => {
    const updated = { ...(empleadoAuthService.getCurrentEmpleado() || {}), ...data, tipo_usuario: 'empleado' };
    localStorage.setItem('empleado', JSON.stringify(updated));
    setEmpleado(updated);
  };

  const value = {
    empleado,
    login,
    logout,
    isAdmin,
    actualizarEmpleado,
    socket,
    onlineUsers,
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
