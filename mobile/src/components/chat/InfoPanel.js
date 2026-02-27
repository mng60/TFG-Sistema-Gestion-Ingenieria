import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArchivosPanel from './ArchivosPanel';

function InfoPanel({ participant, conversacion, currentUser, onClose }) {
  const [infoAdicional, setInfoAdicional] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showArchivos, setShowArchivos] = useState(false);

  useEffect(() => {
    if (participant) {
      cargarInfoAdicional();
    }
  }, [participant]);

  const cargarInfoAdicional = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');

      const response = await fetch(
        `${API_URL}/chat/info-participante/${participant.user_id}/${participant.tipo_usuario}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setInfoAdicional(data.data);
      }
    } catch (error) {
      console.error('Error al cargar info adicional:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!participant) return null;

  return (
    <div className="info-panel-overlay" onClick={onClose}>
      <div className="info-panel" onClick={(e) => e.stopPropagation()}>
        <div className="info-panel-header">
          <button className="btn-back" onClick={onClose}>
            ← Volver
          </button>
          <button className="btn-close-panel" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="info-panel-content">
          {/* Avatar grande */}
          <div className="info-avatar-large">
            <div className="avatar-circle-large">
              {participant.nombre?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>

          {/* Nombre y tipo */}
          <h2 className="info-name">{participant.nombre}</h2>
          <p className="info-type">
            {participant.tipo_usuario === 'empleado' ? '👤 Empleado' : '🏢 Cliente'}
          </p>

          {/* Información de contacto */}
          <div className="info-section">
            <h3>Información de contacto</h3>
            
            <div className="info-item">
              <span className="info-label">📧 Email:</span>
              <span className="info-value">{participant.email || 'No disponible'}</span>
            </div>

            <div className="info-item">
              <span className="info-label">📞 Teléfono:</span>
              <span className="info-value">
                {loading 
                  ? 'Cargando...' 
                  : (infoAdicional?.telefono || 'No disponible')
                }
              </span>
            </div>
          </div>

          {/* Grupos en común */}
          {!loading && infoAdicional?.grupos_comunes?.length > 0 && (
            <div className="info-section">
              <h3>Grupos en común ({infoAdicional.grupos_comunes.length})</h3>
              {infoAdicional.grupos_comunes.map(grupo => (
                <div key={grupo.id} className="grupo-item">
                  <div className="grupo-icon">📁</div>
                  <div className="grupo-info">
                    <strong>{grupo.nombre || `Grupo ${grupo.id}`}</strong>
                    <small>{grupo.participantes_count} participantes</small>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Acciones rápidas */}
          <div className="info-section">
            <h3>Acciones rápidas</h3>

            <button 
              className="info-action-btn"
              onClick={() => setShowArchivos(true)}
            >
              📎 Ver archivos compartidos
            </button>

            <button 
              className="info-action-btn"
              onClick={() => {
                if (participant.tipo_usuario === 'cliente') {
                  navigate(`/proyectos?cliente_id=${participant.user_id}`);
                } else {
                  navigate(`/proyectos?empleado_id=${participant.user_id}`);
                }
                onClose();
              }}
            >
              📁 Ver proyectos
            </button>
          </div>
        </div>

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

export default InfoPanel;