import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatHeaderGrupo from './ChatHeaderGrupo';
import ChatFooter from './ChatFooter';
import MessageBubble from './MessageBubble';

function ChatWindow({ conversacion, socket, currentUser, onReloadConversaciones, onConversationRead, onConversacionEliminada, showToast, onBack, onlineUsers = new Set(), onOpenDirectChat, onConversacionCreada, showInfoPanel, onOpenInfoPanel, onCloseInfoPanel }) {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversacionIdRef = useRef(null);
  const [conversacionLocal, setConversacionLocal] = useState(conversacion);

  const upsertMensaje = (mensajeNuevo) => {
    if (!mensajeNuevo) return;

    setMensajes((prev) => {
      const indexById = mensajeNuevo.id != null
        ? prev.findIndex((msg) => String(msg.id) === String(mensajeNuevo.id))
        : -1;

      const indexByTempId = mensajeNuevo.client_temp_id
        ? prev.findIndex((msg) => msg.client_temp_id && msg.client_temp_id === mensajeNuevo.client_temp_id)
        : -1;

      const existingIndex = indexById >= 0 ? indexById : indexByTempId;

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          ...mensajeNuevo,
          pending: false
        };
        return next;
      }

      return [...prev, mensajeNuevo];
    });
  };

  const removeMensajeTemporal = (clientTempId) => {
    if (!clientTempId) return;

    setMensajes((prev) => prev.filter((msg) => msg.client_temp_id !== clientTempId));
  };

  const handleComposerFocus = () => {
    requestAnimationFrame(() => scrollToBottom(false));
    setTimeout(() => scrollToBottom(false), 100);
    setTimeout(() => scrollToBottom(false), 250);
  };

  // Sincronizar conversacionLocal cuando el padre actualiza la conversación activa
  useEffect(() => {
    setConversacionLocal(conversacion || null);
  }, [conversacion]);

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    if (!conversacion) {
      setMensajes([]);
      conversacionIdRef.current = null;
      return;
    }

    // Solo cargar si cambió realmente la conversación
    if (conversacionIdRef.current !== conversacion.id) {
      conversacionIdRef.current = conversacion.id;
      cargarMensajes();
    }
  }, [conversacion?.id]);

  // Escuchar nuevos mensajes via Socket.io
  useEffect(() => {
    if (!socket || !conversacion) return;

    const handleNewMessage = (mensaje) => {
      if (mensaje.conversacion_id === conversacion.id) {
        upsertMensaje(mensaje);
        scrollToBottom();
        marcarComoLeido();
      }
    };

    const handleUserTyping = (data) => {
      if (data.userId !== currentUser.id) {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    };

    const handleMessagesRead = (data) => {
      if (data.conversacion_id === conversacion.id) {
        setConversacionLocal(prev => {
          if (!prev?.participantes) return prev;
          return {
            ...prev,
            participantes: prev.participantes.map(p =>
              p.user_id === data.user_id && p.tipo_usuario === data.tipo_usuario
                ? { ...p, last_read: data.timestamp }
                : p
            )
          };
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, conversacion?.id, currentUser?.id]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const handleViewportResize = () => {
      if (document.body.classList.contains('keyboard-open')) {
        setTimeout(() => scrollToBottom(false), 60);
      }
    };

    viewport.addEventListener('resize', handleViewportResize);
    return () => viewport.removeEventListener('resize', handleViewportResize);
  }, [mensajes.length]);

  const handleSendFile = async (file, tipoMensaje) => {
    if (!conversacion) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');

      // Crear FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversacion_id', conversacion.id);
      formData.append('tipo_mensaje', tipoMensaje);

      // Subir archivo
      const response = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        if (data.mensaje) {
          upsertMensaje(data.mensaje);
          scrollToBottom();
        }
        // El mensaje se enviará via Socket.io desde el backend
      } else {
        throw new Error(data.message || 'Error al subir archivo');
      }
    } catch (error) {
      console.error('❌ Error al subir archivo:', error);
      throw error;
    }
  };

  // Scroll inicial: múltiples intentos para cubrir imágenes que modifican altura tras el render
  useEffect(() => {
    if (!isInitialLoad || loading || mensajes.length === 0) return;

    const runScroll = () => scrollToBottom(false);

    requestAnimationFrame(runScroll);

    const t1 = setTimeout(runScroll, 60);
    const t2 = setTimeout(runScroll, 180);
    const t3 = setTimeout(() => {
      runScroll();
      setIsInitialLoad(false);
    }, 320);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [mensajes.length, isInitialLoad, loading]);

  const scrollToBottom = (smooth = false) => {
    const container = messagesContainerRef.current;
    if (container) {
      if (smooth) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
    // Fallback con el ref del elemento final
    if (!smooth && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ block: 'end' });
    }
  };

  const cargarMensajes = async () => {
    if (!conversacion || conversacion.ephemeral) return;

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');

      const response = await fetch(`${API_URL}/chat/mensajes/${conversacion.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });

      const data = await response.json();

      if (data.success) {
        setMensajes(data.mensajes || []);
        setIsInitialLoad(true);

        const readAt = data.read_at || new Date().toISOString();

        if (socket && conversacion?.id) {
          socket.emit('mark_read', { conversacion_id: conversacion.id });
        }

        setConversacionLocal((prev) => {
          if (!prev?.participantes) return prev;
          return {
            ...prev,
            participantes: prev.participantes.map((p) =>
              p.user_id === currentUser.id && p.tipo_usuario === 'empleado'
                ? { ...p, last_read: readAt }
                : p
            )
          };
        });
        onConversationRead?.(conversacion.id, readAt);
      }
    } catch (error) {
      console.error('❌ Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeido = () => {
    if (!conversacion || conversacion.ephemeral) return;

    const now = new Date().toISOString();

    if (socket && conversacion.id) {
      socket.emit('mark_read', { conversacion_id: conversacion.id });
    }

    setConversacionLocal((prev) => {
      if (!prev?.participantes) return prev;
      return {
        ...prev,
        participantes: prev.participantes.map((p) =>
          p.user_id === currentUser.id && p.tipo_usuario === 'empleado'
            ? { ...p, last_read: now }
            : p
        )
      };
    });
    onConversationRead?.(conversacion.id, now);
  };

  const handleSendMessage = async (mensaje, tipoMensaje = 'texto') => {
    if (!socket || !conversacion) return;

    if (conversacion.ephemeral) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
        const token = localStorage.getItem('empleado_token');
        const participantes = conversacion.participantes.map(p => ({ user_id: p.user_id, tipo_usuario: p.tipo_usuario }));
        const res = await fetch(`${API_URL}/chat/conversaciones`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: conversacion.tipo, participantes })
        });
        const data = await res.json();
        if (data.success) {
          const realConv = data.conversacion;
          if (onConversacionCreada) onConversacionCreada(realConv);
          socket.emit('join_conversations', [realConv.id]);
          socket.emit(
            'send_message',
            { conversacion_id: realConv.id, mensaje, tipo_mensaje: tipoMensaje },
            () => {}
          );
        }
      } catch (error) {
        console.error('Error al crear conversación efímera:', error);
      }
      return;
    }

    const clientTempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMessage = {
      id: null,
      conversacion_id: conversacion.id,
      user_id: currentUser.id,
      tipo_usuario: 'empleado',
      mensaje,
      tipo_mensaje: tipoMensaje,
      remitente_nombre: currentUser.nombre || 'Tu',
      created_at: new Date().toISOString(),
      client_temp_id: clientTempId,
      pending: true
    };

    upsertMensaje(optimisticMessage);
    scrollToBottom();

    socket.emit(
      'send_message',
      {
        conversacion_id: conversacion.id,
        mensaje,
        tipo_mensaje: tipoMensaje,
        client_temp_id: clientTempId
      },
      (response) => {
        if (response?.success && response.mensaje) {
          upsertMensaje({
            ...response.mensaje,
            client_temp_id: response.mensaje.client_temp_id || clientTempId
          });
          scrollToBottom();
          return;
        }

        removeMensajeTemporal(clientTempId);
        showToast?.(response?.message || 'No se pudo enviar el mensaje', 'error');
      }
    );
  };

  const handleTyping = (isTyping) => {
    if (!socket || !conversacion) return;

    socket.emit('typing', {
      conversacion_id: conversacion.id,
      isTyping
    });
  };

  if (!conversacion) return null;

  const deletionDate = conversacion.deletion_scheduled_at
    ? new Date(conversacion.deletion_scheduled_at).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : null;

  return (
    <div className="chat-window">
      {conversacion.tipo === 'proyecto_grupo' ? (
        <ChatHeaderGrupo
          conversacion={conversacion}
          currentUser={currentUser}
          onConversacionEliminada={onConversacionEliminada}
          showToast={showToast}
          onBack={onBack}
          onOpenDirectChat={onOpenDirectChat}
          showInfoPanel={showInfoPanel}
          onOpenInfoPanel={onOpenInfoPanel}
          onCloseInfoPanel={onCloseInfoPanel}
        />
      ) : (
        <ChatHeader
          conversacion={conversacion}
          currentUser={currentUser}
          onConversacionEliminada={onConversacionEliminada}
          onBack={onBack}
          onlineUsers={onlineUsers}
          showInfoPanel={showInfoPanel}
          onOpenInfoPanel={onOpenInfoPanel}
          onCloseInfoPanel={onCloseInfoPanel}
        />
      )}

      {deletionDate && (
        <div className="chat-deletion-warning">
          <span>⚠️</span>
          <span>
            Este proyecto ha finalizado. Este chat se eliminará el <strong>{deletionDate}</strong>.
            Descarga los archivos importantes antes de esa fecha.
          </span>
        </div>
      )}

      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onLoadCapture={() => {
          if (isInitialLoad) scrollToBottom(false);
        }}
      >
        {loading ? (
          <div className="loading-messages">
            <div className="spinner"></div>
            <p>Cargando mensajes...</p>
          </div>
        ) : (
          <>
            {mensajes.map(mensaje => (
              <MessageBubble
                key={mensaje.id ?? mensaje.client_temp_id}
                mensaje={mensaje}
                isOwn={mensaje.user_id === currentUser.id && mensaje.tipo_usuario === 'empleado'}
                conversacion={conversacionLocal}
              />
            ))}

            {isTyping && (
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatFooter
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onSendFile={handleSendFile}
        showToast={showToast}
        onInputFocus={handleComposerFocus}
      />
    </div>
  );
}

export default ChatWindow;
