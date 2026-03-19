import React, { useState, useEffect, useCallback, useRef } from 'react';
import ConversationList from './ConversationList';
import NuevoConversacionModal from './NuevoConversacionModal';
import ChatWindow from './ChatWindow';
import Toast from '../Toast';
import { useEmpleadoAuth } from '../../context/EmpleadoAuthContext';

function ChatLayout() {
  const { empleado, socket, onlineUsers } = useEmpleadoAuth();
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

  // Cargar conversaciones (solo una vez al montar)
  useEffect(() => {
    cargarConversaciones();
  }, []);

  // Unirse a las salas de conversación cuando cambien, y re-unirse tras reconexión
  useEffect(() => {
    if (!socket || conversaciones.length === 0) return;

    const joinRooms = () => {
      const conversacionesIds = conversaciones.map(c => c.id);
      if (conversacionesIds.length > 0) {
        socket.emit('join_conversations', conversacionesIds);
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
    if (!socket || !empleado) return;

    const handleNewMessage = (mensaje) => {
      const isActive = mensaje.conversacion_id === conversacionActivaIdRef.current;
      const isOwn = mensaje.user_id === empleado.id && mensaje.tipo_usuario === 'empleado';

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
  }, [socket, empleado]);

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
  }, []);

  const cargarConversaciones = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');

      const response = await fetch(`${API_URL}/chat/conversaciones`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
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
    const now = new Date().toISOString();
    const readData = {
      conversacion_id: conversacion.id,
      user_id: empleado.id,
      tipo_usuario: 'empleado',
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
  }, [empleado]);

  const handleMarcarLeida = useCallback((conversacionId, timestamp) => {
    const now = timestamp || new Date().toISOString();
    const readData = {
      conversacion_id: conversacionId,
      user_id: empleado.id,
      tipo_usuario: 'empleado',
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
  }, [empleado]);

  const handleNewConversacion = () => {
    setShowNuevoModal(true);
  };

  const handleConversacionEliminada = useCallback(() => {
    conversacionActivaIdRef.current = null;
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
      conversacionActivaIdRef.current = existing.id;
      setConversacionActiva(existing);
    } else {
      conversacionActivaIdRef.current = null;
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
    conversacionActivaIdRef.current = realConv.id;
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
