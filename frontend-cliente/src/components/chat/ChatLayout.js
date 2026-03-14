import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ConversationList from './ConversationList';
import NuevoConversacionModal from './NuevoConversacionModal';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';

function ChatLayout() {
  const { cliente } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState('list');
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Conectar Socket.io con el token del cliente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
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
  }, []);

  // Cargar conversaciones al montar
  useEffect(() => {
    cargarConversaciones();
  }, []);

  // Unirse a las salas cuando cambie el socket o las conversaciones
  useEffect(() => {
    if (!socket || conversaciones.length === 0) return;
    const ids = conversaciones.map(c => c.id);
    socket.emit('join_conversations', ids);
  }, [socket, conversaciones.length]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const proyectoId = location.state?.proyectoId;
    if (!proyectoId || conversaciones.length === 0) return;

    const conversacionProyecto = conversaciones.find(
      (conv) => conv.tipo === 'proyecto_grupo' && String(conv.proyecto_id) === String(proyectoId)
    );

    if (conversacionProyecto) {
      setConversacionActiva(conversacionProyecto);
      setActiveView('window');
    } else {
      showToast('No se encontró el chat de este proyecto', 'warning');
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [conversaciones, location.pathname, location.state, navigate, showToast]);

  const cargarConversaciones = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/chat/conversaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) setConversaciones(data.conversaciones || []);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const handleSelectConversacion = useCallback((conversacion) => {
    setConversacionActiva(conversacion);
    setActiveView('window');
  }, []);

  const handleConversacionCreada = (nuevaConversacion) => {
    setShowNuevoModal(false);
    cargarConversaciones();
    setConversacionActiva(nuevaConversacion);
    setActiveView('window');
  };

  // El usuario actual para el chat es el cliente autenticado
  const currentUser = cliente ? { ...cliente, tipo_usuario: 'cliente' } : null;

  if (!currentUser) return null;

  return (
    <div className="chat-layout">
      {toast && (
        <div className={`chat-toast chat-toast-${toast.type}`}>{toast.message}</div>
      )}

      <ConversationList
        conversaciones={conversaciones}
        conversacionActiva={conversacionActiva}
        onSelectConversacion={handleSelectConversacion}
        onNewConversacion={() => setShowNuevoModal(true)}
        currentUser={currentUser}
        onlineUsers={onlineUsers}
      />

      <ChatWindow
        conversacion={conversacionActiva}
        socket={socket}
        currentUser={currentUser}
        onReloadConversaciones={cargarConversaciones}
        isActive={activeView === 'window'}
        onBack={() => setActiveView('list')}
        onlineUsers={onlineUsers}
      />

      {showNuevoModal && (
        <NuevoConversacionModal
          onClose={() => setShowNuevoModal(false)}
          onCrear={handleConversacionCreada}
          currentUser={currentUser}
          showToast={showToast}
          conversaciones={conversaciones}
        />
      )}
    </div>
  );
}

export default ChatLayout;
