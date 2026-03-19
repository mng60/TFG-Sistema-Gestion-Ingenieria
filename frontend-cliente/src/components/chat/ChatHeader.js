import React, { useState } from 'react';
import InfoPanel from './InfoPanel';
import { getAvatarInitial } from '../../utils/format';

function ChatHeader({ conversacion, currentUser, onlineUsers = new Set() }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  if (!conversacion) return null;

  const getOtherParticipant = () => {
    if (!conversacion.participantes) return null;
    return conversacion.participantes.find(
      p => !(p.user_id === currentUser.id && p.tipo_usuario === 'cliente')
    );
  };

  const otherParticipant = getOtherParticipant();

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="header-avatar">
            <div className="avatar-circle">
              {getAvatarInitial(otherParticipant?.nombre)}
            </div>
            <div className={`status-indicator ${otherParticipant && onlineUsers.has(`${otherParticipant.user_id}_${otherParticipant.tipo_usuario}`) ? 'online' : ''}`}></div>
          </div>
          <div className="header-details">
            <h3>{otherParticipant?.nombre || 'Usuario'}</h3>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="btn-menu" onClick={() => setShowMenu(!showMenu)}>
            ⋮
          </button>

          {showMenu && (
            <>
              <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                onClick={() => setShowMenu(false)}
              />
              <div className="chat-menu-dropdown">
                <button onClick={() => { setShowMenu(false); setShowInfoPanel(true); }}>
                  Ver info del contacto
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showInfoPanel && (
        <InfoPanel
          participant={otherParticipant}
          conversacion={conversacion}
          currentUser={currentUser}
          onClose={() => setShowInfoPanel(false)}
        />
      )}
    </>
  );
}

export default ChatHeader;
