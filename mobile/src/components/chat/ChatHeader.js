import React, { useState } from 'react';
import InfoPanel from './InfoPanel';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../common/ConfirmModal';

function ChatHeader({ conversacion, currentUser, onConversacionEliminada }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const navigate = useNavigate();

  const getOtherParticipant = () => {
    if (!conversacion.participantes) return null;
    
    return conversacion.participantes.find(
      p => !(p.user_id === currentUser.id && p.tipo_usuario === 'empleado')
    );
  };

  const otherParticipant = getOtherParticipant();

  const handleMenuAction = (action) => {
    setShowMenu(false);

    switch (action) {
      case 'info':
        setShowInfoPanel(true);
        break;
      case 'proyectos':
        // Si es cliente, filtrar por sus proyectos
        if (otherParticipant?.tipo_usuario === 'cliente') {
          navigate(`/proyectos?cliente_id=${otherParticipant.user_id}`);
        } 
        // Si es empleado, filtrar por proyectos compartidos
        else if (otherParticipant?.tipo_usuario === 'empleado') {
          navigate(`/proyectos?empleado_id=${otherParticipant.user_id}`);
        }
        break;
      case 'silenciar':
        break;
      case 'eliminar':
        setConfirmModal({
          title: '⚠️ Eliminar Conversación',
          message: `¿Eliminar la conversación con "${otherParticipant?.nombre}"? Se eliminarán todos los mensajes. Esta acción no se puede deshacer.`,
          type: 'danger',
          confirmText: 'Sí, Eliminar',
          onConfirm: async () => {
            try {
              const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
              const token = localStorage.getItem('empleado_token');

              const response = await fetch(`${API_URL}/chat/conversaciones/${conversacion.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                           'Content-Type': 'application/json'
              });

              const data = await response.json();

              if (data.success) {
                if (onConversacionEliminada) {
                  onConversacionEliminada();
                }
              }
            } catch (error) {
              console.error('Error al eliminar:', error);
            }
          }
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-info">
          {/* Avatar */}
          <div className="header-avatar">
            <div className="avatar-circle">
              {otherParticipant?.nombre?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="status-indicator online"></div>
          </div>

          {/* Nombre y tipo */}
          <div className="header-details">
            <h3>{otherParticipant?.nombre || 'Usuario'}</h3>
            <span className="header-subtitle">
              {otherParticipant?.tipo_usuario === 'empleado' ? 'Empleado' : 'Cliente'}
            </span>
          </div>
        </div>

        {/* Menú opciones */}
        <div className="chat-header-actions">
          <button 
            className="btn-menu"
            onClick={() => setShowMenu(!showMenu)}
          >
            ⋮
          </button>

          {showMenu && (
            <div className="chat-menu-dropdown">
              <button onClick={() => handleMenuAction('info')}>
                📋 Ver info del contacto
              </button>
              
              {otherParticipant?.tipo_usuario === 'cliente' && (
                  <button onClick={() => handleMenuAction('proyectos')}>
                    📁 Ver proyectos
                  </button>
              )}

              {otherParticipant?.tipo_usuario === 'empleado' && (
                <button onClick={() => handleMenuAction('proyectos')}>
                  📁 Proyectos compartidos
                </button>
              )}

              <div className="menu-divider"></div>

              <button onClick={() => handleMenuAction('silenciar')}>
                🔔 Silenciar notificaciones
              </button>
              <button onClick={() => handleMenuAction('eliminar')} className="menu-danger">
                🗑️ Eliminar conversación
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panel de información lateral */}
      {showInfoPanel && (
        <InfoPanel
          participant={otherParticipant}
          conversacion={conversacion}
          currentUser={currentUser}
          onClose={() => setShowInfoPanel(false)}
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

export default ChatHeader;