import React, { useState } from 'react';

function ConversationList({ 
  conversaciones, 
  conversacionActiva, 
  onSelectConversacion, 
  onNewConversacion,
  currentUser 
}) {
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

  const getOtherParticipant = (conversacion) => {
    if (!conversacion.participantes) return null;
    
    return conversacion.participantes.find(
      p => !(p.user_id === currentUser.id && p.tipo_usuario === 'empleado')
    );
  };

  const getNombreConversacion = (conversacion) => {
    // Si es grupo de proyecto, usar el nombre del grupo
    if (conversacion.tipo === 'proyecto_grupo' && conversacion.nombre) {
      return conversacion.nombre;
    }

    // Si es conversación 1-1, usar el nombre del otro participante
    const otherParticipant = getOtherParticipant(conversacion);
    return otherParticipant?.nombre || 'Usuario';
  };

  const getTipoLabel = (conversacion) => {
    if (conversacion.tipo === 'proyecto_grupo') {
      return { text: '📁 Grupo', color: '#27ae60' };
    }
    
    const otherParticipant = getOtherParticipant(conversacion);
    return {
      text: otherParticipant?.tipo_usuario === 'empleado' ? 'Empleado' : 'Cliente',
      color: '#667eea'
    };
  };

  const getAvatarContent = (conversacion) => {
    if (conversacion.tipo === 'proyecto_grupo') {
      return '📁';
    }
    const otherParticipant = getOtherParticipant(conversacion);
    return otherParticipant?.nombre?.charAt(0).toUpperCase() || '?';
  };

  const conversacionesFiltradas = conversaciones.filter(conv => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Si es grupo, buscar por nombre del grupo
    if (conv.tipo === 'proyecto_grupo' && conv.nombre) {
      return conv.nombre.toLowerCase().includes(searchLower);
    }
    
    // Si es 1-1, buscar por nombre del participante
    const other = getOtherParticipant(conv);
    return other?.nombre?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Chats</h2>
      </div>

      {/* Buscador */}
      <div className="conversation-search">
        <input
          type="text"
          placeholder="🔍 Buscar chat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de conversaciones */}
      <div className="conversations-container">
        {conversacionesFiltradas.length === 0 ? (
          <div className="empty-conversations">
            <p>No hay conversaciones</p>
          </div>
        ) : (
          conversacionesFiltradas.map(conversacion => {
            const isActive = conversacionActiva?.id === conversacion.id;
            const tipoInfo = getTipoLabel(conversacion);

            return (
              <div
                key={conversacion.id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectConversacion(conversacion)}
              >
                {/* Avatar */}
                <div className="conversation-avatar">
                  <div className="avatar-circle">
                    {getAvatarContent(conversacion)}
                  </div>
                  <div className={`status-indicator ${conversacion.online ? 'online' : ''}`}></div>
                </div>

                {/* Info */}
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
                    <span 
                      className="participant-type"
                      style={{ background: tipoInfo.color }}
                    >
                      {tipoInfo.text}
                    </span>
                    {conversacion.ultimo_mensaje && (
                      <p className="last-message">
                        {conversacion.ultimo_mensaje.tipo_mensaje === 'archivo' 
                          ? '📎 Archivo'
                          : conversacion.ultimo_mensaje.mensaje
                        }
                      </p>
                    )}
                  </div>

                  {/* Badge de mensajes no leídos */}
                  {conversacion.mensajes_no_leidos > 0 && (
                    <div className="unread-badge">
                      {conversacion.mensajes_no_leidos}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Botón nueva conversación */}
      <button className="btn-new-chat" onClick={onNewConversacion}>
        ➕ Nuevo chat
      </button>
    </div>
  );
}

export default ConversationList;