import React, { useState, useEffect, useCallback, useRef } from 'react';
import ConversationList from './ConversationList';
import NuevoConversacionModal from './NuevoConversacionModal';
import ChatWindow from './ChatWindow';
import Toast from '../common/Toast';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Chat.css';

function ChatLayout() {
  const { empleado, socket, onlineUsers } = useAuth();
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const conversacionActivaIdRef = useRef(null);
  const activeViewRef = useRef('list');
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [toast, setToast] = useState(null);
  // Mobile: 'list' | 'window'
  const [activeView, setActiveView] = useState('list');

  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  useEffect(() => {
    cargarConversaciones();
  }, []);

  useEffect(() => {
    window.history.replaceState(
      {
        ...(window.history.state || {}),
        chatView: 'list'
      },
      ''
    );

    const handlePopState = () => {
      if (activeViewRef.current === 'window') {
        setActiveView('list');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!socket || conversaciones.length === 0) return;
    socket.emit('join_conversations', conversaciones.map((c) => c.id));
  }, [socket, conversaciones.length]);

  // Badge: listener registrado una sola vez por socket, usa ref para evitar stale closure
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (mensaje) => {
      if (mensaje.conversacion_id !== conversacionActivaIdRef.current) {
        setConversaciones(prev => prev.map(c =>
          c.id === mensaje.conversacion_id
            ? { ...c, mensajes_no_leidos: (c.mensajes_no_leidos || 0) + 1 }
            : c
        ));
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket]);

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
    if (activeViewRef.current !== 'window') {
      window.history.pushState(
        {
          ...(window.history.state || {}),
          chatView: 'window',
          conversacionId: conv?.id || null
        },
        ''
      );
    } else {
      window.history.replaceState(
        {
          ...(window.history.state || {}),
          chatView: 'window',
          conversacionId: conv?.id || null
        },
        ''
      );
    }

    conversacionActivaIdRef.current = conv?.id || null;
    setConversacionActiva(conv);
    setActiveView('window');
  }, []);

  const handleBack = () => {
    if (activeViewRef.current === 'window') {
      window.history.back();
      return;
    }

    setActiveView('list');
  };

  const handleConversacionEliminada = useCallback(() => {
    conversacionActivaIdRef.current = null;
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

  const handleOpenDirectChat = useCallback((participant) => {
    if (activeViewRef.current !== 'window') {
      window.history.pushState(
        {
          ...(window.history.state || {}),
          chatView: 'window',
          conversacionId: null
        },
        ''
      );
    }

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

  // Abrir conversación específica al llegar desde una push notification
  useEffect(() => {
    if (!conversaciones.length) return;
    const pendingId = sessionStorage.getItem('push_open_conversacion_id');
    if (!pendingId) return;
    sessionStorage.removeItem('push_open_conversacion_id');
    const conv = conversaciones.find(c => String(c.id) === String(pendingId));
    if (conv) handleSelectConversacion(conv);
  }, [conversaciones, handleSelectConversacion]);

  // Registrar navegador de push mientras el chat está abierto
  useEffect(() => {
    window.__pushNavigateToChat = (conversacionId) => {
      const conv = conversaciones.find(c => String(c.id) === String(conversacionId));
      if (conv) handleSelectConversacion(conv);
    };
    return () => { window.__pushNavigateToChat = null; };
  }, [conversaciones, handleSelectConversacion]);

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
          onlineUsers={onlineUsers}
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
          onlineUsers={onlineUsers}
          onOpenDirectChat={handleOpenDirectChat}
          onConversacionCreada={handleConversacionEfimeraCreada}
        />
      </div>

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
