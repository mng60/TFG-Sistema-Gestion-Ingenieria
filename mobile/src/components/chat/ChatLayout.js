import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import ConversationList from './ConversationList';
import NuevoConversacionModal from './NuevoConversacionModal';
import ChatWindow from './ChatWindow';
import Toast from '../common/Toast';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Chat.css';

function ChatLayout() {
  const { empleado } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [toast, setToast] = useState(null);
  // Mobile: 'list' | 'window'
  const [activeView, setActiveView] = useState('list');

  useEffect(() => {
    const token = localStorage.getItem('empleado_token');
    if (!token) return;
    const hostname = window.location.hostname;
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || `http://${hostname}:5000`;
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    cargarConversaciones();
  }, []);

  useEffect(() => {
    if (!socket || conversaciones.length === 0) return;
    socket.emit('join_conversations', conversaciones.map((c) => c.id));
  }, [socket, conversaciones.length]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const cargarConversaciones = async () => {
    try {
      const hostname = window.location.hostname;
      const API_URL = process.env.REACT_APP_API_URL || `http://${hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');
      const res = await fetch(`${API_URL}/chat/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setConversaciones(data.conversaciones || []);
    } catch (e) {
      console.error('Error al cargar conversaciones:', e);
    }
  };

  const handleSelectConversacion = useCallback((conv) => {
    setConversacionActiva(conv);
    setActiveView('window');
  }, []);

  const handleBack = () => {
    setActiveView('list');
  };

  const handleConversacionEliminada = useCallback(() => {
    setConversacionActiva(null);
    setActiveView('list');
    cargarConversaciones();
  }, []);

  const handleConversacionCreada = (nuevaConv) => {
    setShowNuevoModal(false);
    cargarConversaciones();
    setConversacionActiva(nuevaConv);
    setActiveView('window');
  };

  return (
    <div className="chat-layout-mobile">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Vista lista */}
      <div className={`chat-list-screen ${activeView === 'window' ? 'hidden' : ''}`}>
        <ConversationList
          conversaciones={conversaciones}
          conversacionActiva={conversacionActiva}
          onSelectConversacion={handleSelectConversacion}
          onNewConversacion={() => setShowNuevoModal(true)}
          currentUser={empleado}
        />
      </div>

      {/* Vista conversación */}
      <div className={`chat-window-screen ${activeView === 'window' ? 'visible' : ''}`}>
        <ChatWindow
          conversacion={conversacionActiva}
          socket={socket}
          currentUser={empleado}
          onReloadConversaciones={cargarConversaciones}
          onConversacionEliminada={handleConversacionEliminada}
          showToast={showToast}
          onBack={handleBack}
        />
      </div>

      {showNuevoModal && (
        <NuevoConversacionModal
          onClose={() => setShowNuevoModal(false)}
          onCrear={handleConversacionCreada}
          currentUser={empleado}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default ChatLayout;
