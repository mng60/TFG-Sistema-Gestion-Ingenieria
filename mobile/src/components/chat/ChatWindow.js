import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatHeaderGrupo from './ChatHeaderGrupo';
import ChatFooter from './ChatFooter';
import MessageBubble from './MessageBubble';

function ChatWindow({ conversacion, socket, currentUser, onReloadConversaciones, onConversacionEliminada, showToast, onBack, onlineUsers = new Set(), onOpenDirectChat, onConversacionCreada }) {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversacionIdRef = useRef(null);
  const [conversacionLocal, setConversacionLocal] = useState(conversacion);

  // Sincronizar conversacionLocal cuando el padre actualiza la conversación activa
  useEffect(() => {
    setConversacionLocal(conversacion || null);
  }, [conversacion]);

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    if (!conversacion) {
      setMensajes([]);
      return;
    }

    // Solo cargar si cambió realmente la conversación
    if (conversacionIdRef.current !== conversacion.id) {
      conversacionIdRef.current = conversacion.id;
      cargarMensajes();
      marcarComoLeido().catch(() => {});
    }
  }, [conversacion?.id]);

  // Escuchar nuevos mensajes via Socket.io
  useEffect(() => {
    if (!socket || !conversacion) return;

    const handleNewMessage = (mensaje) => {
      if (mensaje.conversacion_id === conversacion.id) {
        setMensajes(prev => [...prev, mensaje]);
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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setMensajes(data.mensajes || []);
        setIsInitialLoad(true);
      }
    } catch (error) {
      console.error('❌ Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeido = async () => {
    if (!conversacion || conversacion.ephemeral) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');

      await fetch(`${API_URL}/chat/conversaciones/${conversacion.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (socket) {
        socket.emit('mark_read', { conversacion_id: conversacion.id });
      }

    } catch (error) {
      console.error('❌ Error al marcar como leído:', error);
    }
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
          socket.emit('send_message', { conversacion_id: realConv.id, mensaje, tipo_mensaje: tipoMensaje });
        }
      } catch (error) {
        console.error('Error al crear conversación efímera:', error);
      }
      return;
    }

    socket.emit('send_message', {
      conversacion_id: conversacion.id,
      mensaje,
      tipo_mensaje: tipoMensaje
    });
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
        />
      ) : (
        <ChatHeader
          conversacion={conversacion}
          currentUser={currentUser}
          onConversacionEliminada={onConversacionEliminada}
          onBack={onBack}
          onlineUsers={onlineUsers}
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
                key={mensaje.id}
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
      />
    </div>
  );
}

export default ChatWindow;
