import React, { useState } from 'react';
import { Search, Plus, Paperclip } from 'lucide-react';

function ConversationList({ conversaciones, conversacionActiva, onSelectConversacion, onNewConversacion, currentUser, onlineUsers = new Set() }) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const hoy = new Date();
    if (date.toDateString() === hoy.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  // El cliente es el "yo" en las conversaciones
  const getOtherParticipant = (conversacion) => {
    if (!conversacion.participantes) return null;
    return conversacion.participantes.find(
      p => !(p.user_id === currentUser.id && p.tipo_usuario === 'cliente')
    );
  };

  const getNombreConversacion = (conversacion) => {
    if (conversacion.tipo === 'proyecto_grupo' && conversacion.nombre) {
      return conversacion.nombre;
    }
    const other = getOtherParticipant(conversacion);
    return other?.nombre || 'Usuario';
  };

  const getAvatarContent = (conversacion) => {
    if (conversacion.tipo === 'proyecto_grupo') {
      return conversacion.nombre?.charAt(0).toUpperCase() || 'G';
    }
    const other = getOtherParticipant(conversacion);
    return other?.nombre?.charAt(0).toUpperCase() || '?';
  };

  const getConversationSortDate = (conv) =>
    conv?.ultimo_mensaje?.created_at || conv?.updated_at || conv?.created_at || 0;

  const conversacionesFiltradas = conversaciones
    .filter(conv => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      if (conv.tipo === 'proyecto_grupo' && conv.nombre) {
        return conv.nombre.toLowerCase().includes(searchLower);
      }
      const other = getOtherParticipant(conv);
      return other?.nombre?.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => new Date(getConversationSortDate(b)) - new Date(getConversationSortDate(a)));

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Chats</h2>
      </div>

      <div className="conversation-search">
        <Search size={16} color="black" className="search-icon" />
        <input
          type="text"
          placeholder="Buscar chat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="conversations-container">
        {conversacionesFiltradas.length === 0 ? (
          <div className="empty-conversations">
            <p>No hay conversaciones</p>
          </div>
        ) : (
          conversacionesFiltradas.map(conversacion => {
            const isActive = conversacionActiva?.id === conversacion.id;

            return (
              <div
                key={conversacion.id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectConversacion(conversacion)}
              >
                <div className="conversation-avatar">
                  <div className="avatar-circle">{getAvatarContent(conversacion)}</div>
                  {conversacion.tipo !== 'proyecto_grupo' && (() => {
                    const other = getOtherParticipant(conversacion);
                    const isOnline = other ? onlineUsers.has(`${other.user_id}_${other.tipo_usuario}`) : false;
                    return <div className={`status-indicator ${isOnline ? 'online' : ''}`}></div>;
                  })()}
                </div>

                <div className="conversation-info">
                  <div className="conversation-header">
                    <h4>{getNombreConversacion(conversacion)}</h4>
                    {conversacion.ultimo_mensaje && (
                      <span className="conversation-time">
                        {formatearFecha(conversacion.ultimo_mensaje.created_at)}
                      </span>
                    )}
                  </div>

                  <div className="conversation-preview">
                    {conversacion.ultimo_mensaje && (
                      <p className="last-message">
                        {conversacion.ultimo_mensaje.tipo_mensaje === 'archivo'
                          ? <><Paperclip size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />Archivo</>

                          : conversacion.ultimo_mensaje.mensaje}
                      </p>
                    )}
                  </div>

                  {conversacion.mensajes_no_leidos > 0 && (
                    <div className="unread-badge">{conversacion.mensajes_no_leidos}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="btn-new-chat" onClick={onNewConversacion}>
        <Plus size={16} /> Nuevo chat
      </button>
    </div>
  );
}

export default ConversationList;
