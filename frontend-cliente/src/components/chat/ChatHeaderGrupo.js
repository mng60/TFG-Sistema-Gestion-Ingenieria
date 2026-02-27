import React, { useState } from 'react';
import InfoPanelGrupo from './InfoPanelGrupo';

function ChatHeaderGrupo({ conversacion, currentUser }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  if (!conversacion) return null;

  const cantidadParticipantes = conversacion.participantes?.length || 0;

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="header-avatar">
            <div className="avatar-circle">📁</div>
            <div className="status-indicator online"></div>
          </div>
          <div className="header-details">
            <h3>{conversacion.nombre || 'Grupo'}</h3>
            <span className="header-subtitle">
              📁 {cantidadParticipantes} participante{cantidadParticipantes !== 1 ? 's' : ''}
            </span>
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
                  📋 Ver información del grupo
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showInfoPanel && (
        <InfoPanelGrupo
          conversacion={conversacion}
          currentUser={currentUser}
          onClose={() => setShowInfoPanel(false)}
        />
      )}
    </>
  );
}

export default ChatHeaderGrupo;
