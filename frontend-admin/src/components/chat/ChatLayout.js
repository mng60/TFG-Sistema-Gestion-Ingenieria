import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import ConversationList from './ConversationList';
import NuevoConversacionModal from './NuevoConversacionModal';
import ChatWindow from './ChatWindow';
import Toast from '../Toast';
import { useEmpleadoAuth } from '../../context/EmpleadoAuthContext';

function ChatLayout() {
  const { empleado } = useEmpleadoAuth();
  const [socket, setSocket] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState('list');

  // Conectar Socket.io (solo una vez)
  useEffect(() => {
    const token = localStorage.getItem('empleado_token');
    if (!token) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('error', (error) => {
      console.error('❌ Error Socket.io:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []); 

  // Cargar conversaciones (solo una vez al montar)
  useEffect(() => {
    cargarConversaciones();
  }, []); 

  // Unirse a las salas de conversación cuando cambien
  useEffect(() => {
    if (!socket || conversaciones.length === 0) return;

    const conversacionesIds = conversaciones.map(c => c.id);
    socket.emit('join_conversations', conversacionesIds);
  }, [socket, conversaciones.length]); // ✅ Solo cuando cambie socket o la cantidad

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const cargarConversaciones = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');

      const response = await fetch(`${API_URL}/chat/conversaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('empleado_token');
        localStorage.removeItem('empleado');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (data.success) {
        setConversaciones(data.conversaciones || []);
      }
    } catch (error) {
      console.error('❌ Error al cargar conversaciones:', error);
    }
  };

  const handleSelectConversacion = useCallback((conversacion) => {
    setConversacionActiva(conversacion);
    setActiveView('window');
  }, []);

  const handleNewConversacion = () => {
  setShowNuevoModal(true);
};

const handleConversacionEliminada = useCallback(() => {
  setConversacionActiva(null);
  setActiveView('list');
  cargarConversaciones();
}, []);

const handleConversacionCreada = (nuevaConversacion) => {
  setShowNuevoModal(false);
  cargarConversaciones();
  setConversacionActiva(nuevaConversacion);
  setActiveView('window');
};

  return (
    <div className="chat-layout">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConversationList
        conversaciones={conversaciones}
        conversacionActiva={conversacionActiva}
        onSelectConversacion={handleSelectConversacion}
        onNewConversacion={handleNewConversacion}
        currentUser={empleado}
      />

      <ChatWindow
        conversacion={conversacionActiva}
        socket={socket}
        currentUser={empleado}
        onReloadConversaciones={cargarConversaciones}
        onConversacionEliminada={handleConversacionEliminada}
        showToast={showToast}
        isActive={activeView === 'window'}
        onBack={() => setActiveView('list')}
      />

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