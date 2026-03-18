import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ConversationList from './ConversationList';
import NuevoConversacionModal from './NuevoConversacionModal';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';

function ChatLayout() {
  const { cliente, socket, onlineUsers } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const conversacionActivaIdRef = useRef(null);
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState('list');

  const buildLastMessage = (mensaje) => ({
    mensaje: mensaje.mensaje,
    tipo_mensaje: mensaje.tipo_mensaje,
    created_at: mensaje.created_at,
    user_id: mensaje.user_id,
    tipo_usuario: mensaje.tipo_usuario
  });

  const applyIncomingMessageToConversation = (conv, mensaje, isActive, isOwn) => {
    if (!conv || conv.id !== mensaje.conversacion_id) return conv;
    return {
      ...conv,
      ultimo_mensaje: buildLastMessage(mensaje),
      updated_at: mensaje.created_at,
      mensajes_no_leidos: isActive || isOwn
        ? 0
        : (conv.mensajes_no_leidos || 0) + 1
    };
  };

  const moveConversationToTop = (list, conversacionId) => {
    const target = list.find((c) => c.id === conversacionId);
    if (!target) return list;
    return [target, ...list.filter((c) => c.id !== conversacionId)];
  };

  const applyReadReceiptToConversation = (conv, data) => {
    if (!conv || conv.id !== data.conversacion_id) return conv;
    return {
      ...conv,
      participantes: Array.isArray(conv.participantes)
        ? conv.participantes.map((p) =>
            p.user_id === data.user_id && p.tipo_usuario === data.tipo_usuario
              ? { ...p, last_read: data.timestamp }
              : p
          )
        : conv.participantes
    };
  };

  // Cargar conversaciones al montar
  useEffect(() => {
    cargarConversaciones();
  }, []);

  // Unirse a las salas cuando cambie el socket o las conversaciones, y re-unirse tras reconexión
  useEffect(() => {
    if (!socket || conversaciones.length === 0) return;

    const joinRooms = () => {
      const ids = conversaciones.map(c => c.id);
      if (ids.length > 0) {
        socket.emit('join_conversations', ids);
      }
    };

    if (socket.connected) {
      joinRooms();
    }

    socket.on('connect', joinRooms);

    return () => {
      socket.off('connect', joinRooms);
    };
  }, [socket, conversaciones]);

  // Actualizar lista y conversación activa al recibir mensaje nuevo
  useEffect(() => {
    if (!socket || !cliente) return;

    const handleNewMessage = (mensaje) => {
      const isActive = mensaje.conversacion_id === conversacionActivaIdRef.current;
      const isOwn = mensaje.user_id === cliente.id && mensaje.tipo_usuario === 'cliente';

      setConversaciones((prev) => {
        const updated = prev.map((c) =>
          applyIncomingMessageToConversation(c, mensaje, isActive, isOwn)
        );
        return moveConversationToTop(updated, mensaje.conversacion_id);
      });

      setConversacionActiva((prev) =>
        prev?.id === mensaje.conversacion_id
          ? applyIncomingMessageToConversation(prev, mensaje, true, isOwn)
          : prev
      );
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, cliente]);

  // Propagar messages_read al estado global de conversaciones y conversacionActiva
  useEffect(() => {
    if (!socket) return;
    const handleMessagesRead = (data) => {
      setConversaciones((prev) =>
        prev.map((c) => applyReadReceiptToConversation(c, data))
      );
      setConversacionActiva((prev) =>
        applyReadReceiptToConversation(prev, data)
      );
    };
    socket.on('messages_read', handleMessagesRead);
    return () => {
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket]);

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
      conversacionActivaIdRef.current = conversacionProyecto.id;
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
    const now = new Date().toISOString();
    const readData = {
      conversacion_id: conversacion.id,
      user_id: cliente.id,
      tipo_usuario: 'cliente',
      timestamp: now
    };
    const conversacionActualizada = {
      ...applyReadReceiptToConversation(conversacion, readData),
      mensajes_no_leidos: 0
    };
    conversacionActivaIdRef.current = conversacion?.id || null;
    setConversacionActiva(conversacionActualizada);
    setActiveView('window');
    setConversaciones((prev) =>
      prev.map((c) =>
        c.id === conversacion.id
          ? { ...applyReadReceiptToConversation(c, readData), mensajes_no_leidos: 0 }
          : c
      )
    );
  }, [cliente]);

  const handleMarcarLeida = useCallback((conversacionId) => {
    const now = new Date().toISOString();
    const readData = {
      conversacion_id: conversacionId,
      user_id: cliente.id,
      tipo_usuario: 'cliente',
      timestamp: now
    };
    setConversaciones((prev) =>
      prev.map((c) =>
        c.id === conversacionId
          ? { ...applyReadReceiptToConversation(c, readData), mensajes_no_leidos: 0 }
          : c
      )
    );
    setConversacionActiva((prev) =>
      prev?.id === conversacionId
        ? { ...applyReadReceiptToConversation(prev, readData), mensajes_no_leidos: 0 }
        : prev
    );
  }, [cliente]);

  const handleConversacionCreada = (nuevaConversacion) => {
    setShowNuevoModal(false);
    cargarConversaciones();
    conversacionActivaIdRef.current = nuevaConversacion.id;
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
        onMarcarLeida={handleMarcarLeida}
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
