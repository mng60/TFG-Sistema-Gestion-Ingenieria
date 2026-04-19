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
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    const empleadoGuardado = authService.getCurrentEmpleado();
    const token = authService.getToken();
    if (empleadoGuardado && token) {
      setEmpleado(empleadoGuardado);
      authService.getProfile()
        .then(updated => { if (updated) setEmpleado(updated); })
        .catch(() => {});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setEmpleado(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!empleado) {
      setSocket(prev => { if (prev) prev.close(); return null; });
      setOnlineUsers(new Set());
      return;
    }
    const token = localStorage.getItem('empleado_token');
    if (!token) return;
    const hostname = window.location.hostname;
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || `http://${hostname}:5000`;
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });
    newSocket.on('online_users', (keys) => setOnlineUsers(new Set(keys)));
    newSocket.on('user_online', ({ userId, tipoUsuario }) =>
      setOnlineUsers(prev => new Set([...prev, `${userId}_${tipoUsuario}`]))
    );
    newSocket.on('user_offline', ({ userId, tipoUsuario }) =>
      setOnlineUsers(prev => { const next = new Set(prev); next.delete(`${userId}_${tipoUsuario}`); return next; })
    );
    setSocket(newSocket);
    return () => newSocket.close();
  }, [empleado?.id]);

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

  const actualizarEmpleado = (data) => {
    const updated = { ...(authService.getCurrentEmpleado() || {}), ...data };
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
        fontSize: '1.2rem'
      }}>
        Cargando...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
