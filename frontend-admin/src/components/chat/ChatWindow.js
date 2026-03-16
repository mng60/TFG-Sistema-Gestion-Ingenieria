import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatHeaderGrupo from './ChatHeaderGrupo';
import ChatFooter from './ChatFooter';
import MessageBubble from './MessageBubble';
import { MessagesSquare } from 'lucide-react';

function ChatWindow({ conversacion, socket, currentUser, onReloadConversaciones, onMarcarLeida, onConversacionEliminada, showToast, isActive, onBack, onlineUsers = new Set(), onOpenDirectChat, onConversacionCreada }) {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const conversacionIdRef = useRef(null);
  const [conversacionLocal, setConversacionLocal] = useState(conversacion); 

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
      marcarComoLeido();
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
      if (data.conversacion_id !== conversacion.id) return;
      const isMe = data.userId === currentUser.id && data.tipoUsuario === 'empleado';
      if (!isMe) {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    };

    const handleMessagesRead = async (data) => {
      
      if (data.conversacion_id === conversacion.id) {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const token = localStorage.getItem('empleado_token');

          const response = await fetch(`${API_URL}/chat/conversaciones/${conversacion.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const result = await response.json();
          
          if (result.success) {
            setConversacionLocal(result.conversacion);
          }
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

  const handleSendFile = async (file, tipoMensaje) => {
    if (!conversacion) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
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

  // Scroll automático al final
  useEffect(() => {
    scrollToBottom('smooth');
  }, [mensajes]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const cargarMensajes = async () => {
    if (!conversacion || conversacion.ephemeral) return;

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');

      const response = await fetch(`${API_URL}/chat/mensajes/${conversacion.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        setMensajes(data.mensajes || []);
        setTimeout(() => scrollToBottom('instant'), 50);
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
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');

      await fetch(`${API_URL}/chat/conversaciones/${conversacion.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (socket) {
        socket.emit('mark_read', { conversacion_id: conversacion.id });
      }

      if (onMarcarLeida) onMarcarLeida(conversacion.id);
    } catch (error) {
      console.error('❌ Error al marcar como leído:', error);
    }
  };

  const handleSendMessage = async (mensaje, tipoMensaje = 'texto') => {
    if (!socket || !conversacion) return;

    if (conversacion.ephemeral) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
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

  if (!conversacion) {
    return (
      <div className={`chat-window empty${isActive ? ' active' : ''}`}>
        <div className="empty-chat">
          <div className="empty-icon"><MessagesSquare size={100}/></div>
          <h3>Selecciona una conversación</h3>
          <p>Elige un chat de la izquierda para empezar a hablar</p>
        </div>
      </div>
    );
  }

  const deletionDate = conversacion.deletion_scheduled_at
    ? new Date(conversacion.deletion_scheduled_at).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : null;

  return (
    <div className={`chat-window${isActive ? ' active' : ''}`}>
      {onBack && (
        <div className="chat-mobile-back">
          <button onClick={onBack}>← Volver</button>
        </div>
      )}
      {conversacion.tipo === 'proyecto_grupo' ? (
        <ChatHeaderGrupo
          conversacion={conversacion}
          currentUser={currentUser}
          onConversacionEliminada={onConversacionEliminada}
          showToast={showToast}
          onOpenDirectChat={onOpenDirectChat}
        />
      ) : (
        <ChatHeader
          conversacion={conversacion}
          currentUser={currentUser}
          onConversacionEliminada={onConversacionEliminada}
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