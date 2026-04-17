import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { formatearFechaLista, getConversationSortDate } from './chatUtils';
import { getAvatarInitial, getAvatarSrc } from '../../utils/format';

function ConversationList({
  conversaciones,
  conversacionActiva,
  onSelectConversacion,
  onNewConversacion,
  currentUser,
  onlineUsers = new Set()
}) {
  const [searchTerm, setSearchTerm] = useState('');

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
      return { text: 'Grupo', color: '#27ae60' };
    }
    const otherParticipant = getOtherParticipant(conversacion);
    if (otherParticipant?.tipo_usuario === 'cliente') {
      return { text: 'Cliente', color: '#e67e22' };
    }
    if (otherParticipant?.rol === 'admin') {
      return { text: 'Administrador', color: '#8e44ad' };
    }
    return { text: 'Empleado', color: '#3498db' };
  };

  const getAvatarContent = (conversacion) => {
    if (conversacion.tipo === 'proyecto_grupo') {
      return getAvatarInitial(conversacion.nombre, 'G');
    }
    const otherParticipant = getOtherParticipant(conversacion);
    if (getAvatarSrc(otherParticipant?.foto_url)) {
      return <img src={getAvatarSrc(otherParticipant.foto_url)} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    }
    return getAvatarInitial(otherParticipant?.nombre);
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
  })
  .sort((a, b) => new Date(getConversationSortDate(b)) - new Date(getConversationSortDate(a)));

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <h2>Chats</h2>
      </div>

      {/* Buscador */}
      <div className="conversation-search">
        <Search size={16} color="black" className="search-icon" />
        <input
          type="text"
          placeholder="Buscar chat..."
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
                  {conversacion.tipo !== 'proyecto_grupo' && (() => {
                    const other = getOtherParticipant(conversacion);
                    const isOnline = other ? onlineUsers.has(`${other.user_id}_${other.tipo_usuario}`) : false;
                    return <div className={`status-indicator ${isOnline ? 'online' : ''}`}></div>;
                  })()}
                </div>

                {/* Info */}
                <div className="conversation-info">
                  <div className="conversation-header">
                    <h4>{getNombreConversacion(conversacion)}</h4>
                    {conversacion.ultimo_mensaje && (
                      <span className="conversation-time">
                        {formatearFechaLista(conversacion.ultimo_mensaje.created_at)}
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
        <Plus size={16} /> Nuevo chat
      </button>
    </div>
  );
}

export default ConversationList;