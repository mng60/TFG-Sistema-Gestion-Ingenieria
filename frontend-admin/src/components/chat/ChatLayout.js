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
  const [onlineUsers, setOnlineUsers] = useState(new Set());

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

  // Badge: incrementar no leídos en conversaciones que no están activas
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (mensaje) => {
      if (mensaje.conversacion_id !== conversacionActiva?.id) {
        setConversaciones(prev => prev.map(c =>
          c.id === mensaje.conversacion_id
            ? { ...c, mensajes_no_leidos: (c.mensajes_no_leidos || 0) + 1 }
            : c
        ));
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, conversacionActiva?.id]);

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
    setConversaciones(prev => prev.map(c =>
      c.id === conversacion.id ? { ...c, mensajes_no_leidos: 0 } : c
    ));
  }, []);

  const handleMarcarLeida = useCallback((conversacionId) => {
    setConversaciones(prev => prev.map(c =>
      c.id === conversacionId ? { ...c, mensajes_no_leidos: 0 } : c
    ));
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

const handleOpenDirectChat = useCallback((participant) => {
  const tipoConv = participant.tipo_usuario === 'cliente' ? 'empleado_cliente' : 'empleado_empleado';
  const existing = conversaciones.find(c =>
    c.tipo === tipoConv &&
    c.participantes?.some(p => p.user_id === participant.user_id && p.tipo_usuario === participant.tipo_usuario)
  );
  if (existing) {
    setConversacionActiva(existing);
  } else {
    setConversacionActiva({
      id: null,
      ephemeral: true,
      tipo: tipoConv,
      nombre: null,
      proyecto_id: null,
      participantes: [
        { user_id: empleado.id, tipo_usuario: 'empleado', nombre: empleado.nombre, email: empleado.email, rol: empleado.rol, foto_url: empleado.foto_url },
        { user_id: participant.user_id, tipo_usuario: participant.tipo_usuario, nombre: participant.nombre, email: participant.email, rol: participant.rol, foto_url: participant.foto_url }
      ]
    });
  }
  setActiveView('window');
}, [conversaciones, empleado]);

const handleConversacionEfimeraCreada = useCallback((realConv) => {
  setConversacionActiva(realConv);
  cargarConversaciones();
}, []);

  return (
    <div className="chat-layout">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConversationList
        conversaciones={conversaciones}
        conversacionActiva={conversacionActiva}
        onSelectConversacion={handleSelectConversacion}
        onNewConversacion={handleNewConversacion}
        currentUser={empleado}
        onlineUsers={onlineUsers}
      />

      <ChatWindow
        conversacion={conversacionActiva}
        socket={socket}
        currentUser={empleado}
        onReloadConversaciones={cargarConversaciones}
        onMarcarLeida={handleMarcarLeida}
        onConversacionEliminada={handleConversacionEliminada}
        showToast={showToast}
        isActive={activeView === 'window'}
        onBack={() => setActiveView('list')}
        onlineUsers={onlineUsers}
        onOpenDirectChat={handleOpenDirectChat}
        onConversacionCreada={handleConversacionEfimeraCreada}
      />

      {showNuevoModal && (
      <NuevoConversacionModal
        onClose={() => setShowNuevoModal(false)}
        onCrear={handleConversacionCreada}
        currentUser={empleado}
        showToast={showToast}
        conversaciones={conversaciones}
      />
    )}
    </div>
  );
}

export default ChatLayout;