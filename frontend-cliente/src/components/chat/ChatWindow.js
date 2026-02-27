import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatHeaderGrupo from './ChatHeaderGrupo';
import ChatFooter from './ChatFooter';
import MessageBubble from './MessageBubble';

function ChatWindow({ conversacion, socket, currentUser, onReloadConversaciones, isActive, onBack }) {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const conversacionIdRef = useRef(null);
  const [conversacionLocal, setConversacionLocal] = useState(conversacion);

  useEffect(() => {
    if (!conversacion) { setMensajes([]); return; }
    if (conversacionIdRef.current !== conversacion.id) {
      conversacionIdRef.current = conversacion.id;
      setConversacionLocal(conversacion);
      cargarMensajes();
      marcarComoLeido();
    }
  }, [conversacion?.id]);

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
        if (data.isTyping) setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleMessagesRead = async (data) => {
      if (data.conversacion_id === conversacion.id) {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/chat/conversaciones/${conversacion.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await response.json();
          if (result.success) setConversacionLocal(result.conversacion);
        } catch (error) {
          console.error('Error al actualizar conversación:', error);
        }
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

  useEffect(() => { scrollToBottom(); }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cargarMensajes = async () => {
    if (!conversacion) return;
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/chat/mensajes/${conversacion.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setMensajes(data.mensajes || []);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeido = async () => {
    if (!conversacion) return;
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/chat/conversaciones/${conversacion.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (socket) socket.emit('mark_read', { conversacion_id: conversacion.id });
      onReloadConversaciones();
    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
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
          <div className="empty-icon">💬</div>
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
        <ChatHeader conversacion={conversacion} currentUser={currentUser} />
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

      <div className="chat-messages">
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
