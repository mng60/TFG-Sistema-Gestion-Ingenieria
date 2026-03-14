import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paperclip, CircleMinus, FolderOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../common/ConfirmModal';
import ArchivosPanel from './ArchivosPanel';

function InfoPanelGrupo({ conversacion, currentUser, onClose, onConversacionEliminada, showToast, onOpenDirectChat }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [proyecto, setProyecto] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);
  const [showArchivos, setShowArchivos] = useState(false);

  useEffect(() => {
    if (conversacion.proyecto_id) {
      cargarDatosProyecto();
    } else {
      setParticipantes(conversacion.participantes || []);
      setLoading(false);
    }
  }, [conversacion]);

  const cargarDatosProyecto = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');

      const response = await fetch(`${API_URL}/proyectos/${conversacion.proyecto_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setProyecto(data.proyecto);
      }

      setParticipantes(conversacion.participantes || []);
    } catch (error) {
      console.error('Error al cargar proyecto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarParticipante = (participante) => {
    if (participante.user_id === currentUser.id) {
      showToast('No puedes eliminarte a ti mismo del grupo', 'warning');
      return;
    }

    setConfirmModal({
      title: 'Eliminar Participante',
      message: `¿Eliminar a "${participante.nombre}" del grupo?`,
      type: 'warning',
      confirmText: 'Sí, Eliminar',
      onConfirm: async () => {
        try {
          const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
          const token = localStorage.getItem('empleado_token');

          const response = await fetch(
            `${API_URL}/chat/conversaciones/${conversacion.id}/participantes/${participante.user_id}/${participante.tipo_usuario}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          const data = await response.json();

          if (data.success) {
            setParticipantes(prev => prev.filter(
              p => !(p.user_id === participante.user_id && p.tipo_usuario === participante.tipo_usuario)
            ));
            showToast('Participante eliminado correctamente', 'success');
          } else {
            showToast(data.message || 'Error al eliminar participante', 'error');
          }
        } catch (error) {
          console.error('Error:', error);
          showToast('Error al eliminar participante', 'error');
        }
      }
    });
  };

  if (!conversacion) return null;

  return (
    <div className="info-panel-overlay" onClick={onClose}>
      <div className="info-panel" onClick={(e) => e.stopPropagation()}>
        <div className="info-panel-header">
          <button className="btn-back" onClick={onClose}>
            ← Volver
          </button>
        </div>

        <div className="info-panel-content">
          {/* Avatar grande */}
          <div className="info-avatar-large">
            <div className="avatar-circle-large">
              {conversacion.nombre?.charAt(0).toUpperCase() || 'G'}
            </div>
          </div>

          {/* Nombre del grupo */}
          <h2 className="info-name">{conversacion.nombre || 'Grupo'}</h2>
          <p className="info-type">Grupo de Proyecto</p>

          {/* Información del proyecto */}
          {loading ? (
            <p style={{ textAlign: 'center', color: '#95a5a6' }}>Cargando...</p>
          ) : proyecto ? (
            <div className="info-section">
              <h3>Proyecto</h3>
              <div className="proyecto-info-card">
                <strong>{proyecto.nombre}</strong>
              </div>
            </div>
          ) : null}

          {/* Participantes */}
          <div className="info-section">
            <h3>Participantes ({participantes.length})</h3>
            <div className="participantes-list">
              {participantes.map((participante, index) => (
                <div
                  key={`${participante.user_id}-${participante.tipo_usuario}-${index}`}
                  className="participante-item"
                  onClick={() => {
                    if (participante.user_id === currentUser.id && participante.tipo_usuario === 'empleado') return;
                    if (onOpenDirectChat) { onOpenDirectChat(participante); onClose(); }
                  }}
                  style={{ cursor: participante.user_id === currentUser.id ? 'default' : 'pointer' }}
                >
                  <div className="participante-avatar">
                    <div className="avatar-circle" style={{ width: 34, height: 34, fontSize: '0.85rem' }}>
                      {participante.foto_url
                        ? <img src={`${process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`}${participante.foto_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : participante.nombre?.charAt(0).toUpperCase() || '?'
                      }
                    </div>
                  </div>
                  <div className="participante-info">
                    <strong>{participante.nombre}</strong>
                    <small>{participante.tipo_usuario === 'empleado' ? (participante.rol === 'admin' ? 'Administrador' : 'Empleado') : 'Cliente'}</small>
                  </div>
                  {isAdmin() &&
                   participante.user_id !== currentUser.id &&
                   participante.tipo_usuario === 'empleado' && (
                    <button
                      className="btn-remove-participant"
                      onClick={() => handleEliminarParticipante(participante)}
                      title="Eliminar del grupo"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <CircleMinus size={22} color="#e74c3c" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Acciones rápidas */}
          {proyecto && (
            <div className="info-section">
              <h3>Acciones rápidas</h3>
              
              <button 
                className="info-action-btn"
                onClick={() => setShowArchivos(true)}
              >
                <Paperclip size={14} color="grey" /> Ver archivos compartidos
              </button>
              
              <button 
                className="info-action-btn"
                onClick={() => {
                  navigate(`/proyectos/${proyecto.id}`);
                  onClose();
                }}
              >
                <FolderOpen size={14} /> Ver proyecto completo
              </button>
            </div>
          )}
        </div>

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

        {showArchivos && (
          <ArchivosPanel
            conversacionId={conversacion.id}
            onClose={() => setShowArchivos(false)}
          />
        )}

      </div>
    </div>
  );
}

export default InfoPanelGrupo;
