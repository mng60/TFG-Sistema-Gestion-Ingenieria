import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatHeaderGrupo from './ChatHeaderGrupo';
import ChatFooter from './ChatFooter';
import MessageBubble from './MessageBubble';
import {MessagesSquare} from 'lucide-react'

function ChatWindow({ conversacion, socket, currentUser, onReloadConversaciones, onMarcarLeida, isActive, onBack, onlineUsers = new Set() }) {
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

  useEffect(() => {
    if (!conversacion) { setMensajes([]); return; }
    if (conversacionIdRef.current !== conversacion.id) {
      conversacionIdRef.current = conversacion.id;
      setConversacionLocal(conversacion);
      cargarMensajes();
    }
  }, [conversacion?.id]);

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

  useEffect(() => {
    if (!socket || !conversacion) return;

    const handleNewMessage = (mensaje) => {
      if (mensaje.conversacion_id === conversacion.id) {
        setMensajes(prev => [...prev, mensaje]);
        setTimeout(() => scrollToBottom(true), 30);
        marcarComoLeido();
      }
    };

    const handleUserTyping = (data) => {
      if (data.conversacion_id !== conversacion.id) return;
      const isMe = data.userId === currentUser.id && data.tipoUsuario === 'cliente';
      if (!isMe) {
        setIsTyping(data.isTyping);
        if (data.isTyping) setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleMessagesRead = (data) => {
      if (data.conversacion_id === conversacion.id) {
        // Actualizar last_read del participante directamente, sin fetch
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
    if (!conversacion) return;
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
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

        if (onMarcarLeida && conversacion?.id) {
          onMarcarLeida(conversacion.id, readAt);
        }

        setConversacionLocal((prev) => {
          if (!prev?.participantes) return prev;
          return {
            ...prev,
            participantes: prev.participantes.map((p) =>
              p.user_id === currentUser.id && p.tipo_usuario === currentUser.tipo_usuario
                ? { ...p, last_read: readAt }
                : p
            )
          };
        });

        if (!data.read_updated) {
          console.warn('[cliente/chat] getMensajes no actualizó last_read', {
            conversacionId: conversacion?.id,
            readAt
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
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

    if (onMarcarLeida) {
      onMarcarLeida(conversacion.id);
    }

    setConversacionLocal((prev) => {
      if (!prev?.participantes) return prev;
      return {
        ...prev,
        participantes: prev.participantes.map((p) =>
          p.user_id === currentUser.id && p.tipo_usuario === currentUser.tipo_usuario
            ? { ...p, last_read: now }
            : p
        )
      };
    });
  };

  const handleSendMessage = (mensaje, tipoMensaje = 'texto') => {
    if (!socket || !conversacion) return;
    socket.emit('send_message', { conversacion_id: conversacion.id, mensaje, tipo_mensaje: tipoMensaje });
  };

  const handleTyping = (typing) => {
    if (!socket || !conversacion) return;
    socket.emit('typing', { conversacion_id: conversacion.id, isTyping: typing });
  };

  const handleSendFile = async (file, tipoMensaje) => {
    if (!conversacion) return;
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversacion_id', conversacion.id);
    formData.append('tipo_mensaje', tipoMensaje);

    const response = await fetch(`${API_URL}/chat/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Error al subir archivo');
  };

  // Banner de aviso de borrado
  const deletionDate = conversacion?.deletion_scheduled_at
    ? new Date(conversacion.deletion_scheduled_at).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : null;

  if (!conversacion) {
    return (
      <div className={`chat-window empty${isActive ? ' active' : ''}`}>
        <div className="empty-chat">
          <div className="empty-icon"><MessagesSquare size={100}/></div>
          <h3>Selecciona una conversación</h3>
          <p>Elige un chat de la izquierda para empezar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-window${isActive ? ' active' : ''}`}>
      {onBack && (
        <div className="chat-mobile-back">
          <button onClick={onBack}>← Volver</button>
        </div>
      )}
      {conversacion.tipo === 'proyecto_grupo' ? (
        <ChatHeaderGrupo conversacion={conversacion} currentUser={currentUser} />
      ) : (
        <ChatHeader conversacion={conversacion} currentUser={currentUser} onlineUsers={onlineUsers} />
      )}

      {deletionDate && (
        <div className="chat-deletion-warning">
          <span>⚠️</span>
          <span>
            Este proyecto ha finalizado. Este chat se eliminará el <strong>{deletionDate}</strong>.
            Descarga tus archivos importantes antes de esa fecha.
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
                isOwn={mensaje.user_id === currentUser.id && mensaje.tipo_usuario === 'cliente'}
                conversacion={conversacionLocal}
              />
            ))}

            {isTyping && (
              <div className="typing-indicator">
                <span></span><span></span><span></span>
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
      />
    </div>
  );
}

export default ChatWindow;
