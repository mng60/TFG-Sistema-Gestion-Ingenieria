import React, { useState } from 'react';
import InfoPanelGrupo from './InfoPanelGrupo';
import ConfirmModal from '../common/ConfirmModal';

function ChatHeaderGrupo({ conversacion, currentUser, onConversacionEliminada, showToast }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const handleMenuAction = (action) => {
    setShowMenu(false);

    switch (action) {
      case 'info':
        setShowInfoPanel(true);
        break;
      case 'silenciar':
        break;
      case 'eliminar':
        setConfirmModal({
          title: '⚠️ Eliminar Grupo',
          message: `¿Eliminar el grupo "${conversacion.nombre}"? Se eliminarán todos los mensajes. Esta acción no se puede deshacer.`,
          type: 'danger',
          confirmText: 'Sí, Eliminar',
          onConfirm: async () => {
            try {
              const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
              const token = localStorage.getItem('empleado_token');

              const response = await fetch(`${API_URL}/chat/conversaciones/${conversacion.id}`, {
                method: 'DELETE',
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              const data = await response.json();

              if (data.success) {
                showToast('Grupo eliminado correctamente', 'success');
                if (onConversacionEliminada) {
                  onConversacionEliminada();
                }
              } else {
                showToast(data.message || 'Error al eliminar grupo', 'error');
              }
            } catch (error) {
              console.error('Error al eliminar:', error);
              showToast('Error al eliminar grupo', 'error');
            }
          }
        });
        break;
      default:
        break;
    }
  };

  const cantidadParticipantes = conversacion.participantes?.length || 0;

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="header-avatar">
            <div className="avatar-circle">
              📁
            </div>
            <div className="status-indicator online"></div>
          </div>

          <div className="header-details">
            <h3>{conversacion.nombre || 'Grupo'}</h3>
            <span className="header-subtitle">
              📁 {cantidadParticipantes} participantes
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
          <button 
            className="btn-menu"
            onClick={() => setShowMenu(!showMenu)}
          >
            ⋮
          </button>

          {showMenu && (
            <>
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
                onClick={() => setShowMenu(false)}
              />

              <div className="chat-menu-dropdown">
                <button onClick={() => handleMenuAction('info')}>
                  📋 Ver información del grupo
                </button>

                <div className="menu-divider"></div>

                <button onClick={() => handleMenuAction('silenciar')}>
                  🔔 Silenciar notificaciones
                </button>
                <button onClick={() => handleMenuAction('eliminar')} className="menu-danger">
                  🗑️ Eliminar grupo
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
          onConversacionEliminada={onConversacionEliminada}
          showToast={showToast}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </>
  );
}

export default ChatHeaderGrupo;