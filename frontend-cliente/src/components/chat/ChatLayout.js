import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import ConversationList from './ConversationList';
import NuevoConversacionModal from './NuevoConversacionModal';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';

function ChatLayout() {
  const { cliente } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState('list');

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
      />

      <ChatWindow
        conversacion={conversacionActiva}
        socket={socket}
        currentUser={currentUser}
        onReloadConversaciones={cargarConversaciones}
        isActive={activeView === 'window'}
        onBack={() => setActiveView('list')}
      />

      {showNuevoModal && (
        <NuevoConversacionModal
          onClose={() => setShowNuevoModal(false)}
          onCrear={handleConversacionCreada}
          currentUser={currentUser}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default ChatLayout;
