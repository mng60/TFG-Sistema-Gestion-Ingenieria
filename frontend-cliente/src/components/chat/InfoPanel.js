import React, { useState, useEffect } from 'react';
import { Paperclip, Mail, Phone } from 'lucide-react';
import ArchivosPanel from './ArchivosPanel';
import { getAvatarInitial } from '../../utils/format';

function InfoPanel({ participant, conversacion, currentUser, onClose }) {
  const [infoAdicional, setInfoAdicional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showArchivos, setShowArchivos] = useState(false);

  useEffect(() => {
    if (participant) cargarInfoAdicional();
  }, [participant]);

  const cargarInfoAdicional = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_URL}/chat/info-participante/${participant.user_id}/${participant.tipo_usuario}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) setInfoAdicional(data.data);
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
          <button className="btn-back" onClick={onClose}>← Volver</button>
        </div>

        <div className="info-panel-content">
          <div className="info-avatar-large">
            <div className="avatar-circle-large">
              {getAvatarInitial(participant.nombre)}
            </div>
          </div>

          <h2 className="info-name">{participant.nombre}</h2>
          <p className="info-type">
            {participant.tipo_usuario === 'cliente'
              ? 'Cliente'
              : participant.rol === 'admin' ? 'Administrador' : 'Empleado'
            }
          </p>

          <div className="info-section">
            <h3>Información de contacto</h3>
            <div className="info-item">
              <span className="info-label"><Mail size={14} /> Email:</span>
              <span className="info-value">
                {loading
                  ? 'Cargando...'
                  : (participant.email || infoAdicional?.email || 'No disponible')
                }
              </span>
            </div>
            <div className="info-item">
              <span className="info-label"><Phone size={14} /> Teléfono:</span>
              <span className="info-value">
                {loading ? 'Cargando...' : (infoAdicional?.telefono || 'No disponible')}
              </span>
            </div>
          </div>

          {!loading && infoAdicional?.grupos_comunes?.length > 0 && (
            <div className="info-section">
              <h3>Grupos en común ({infoAdicional.grupos_comunes.length})</h3>
              {infoAdicional.grupos_comunes.map(grupo => (
                <div key={grupo.id} className="grupo-item">
                  <div className="grupo-icon">
                    <div className="avatar-circle" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                      {getAvatarInitial(grupo.nombre, 'G')}
                    </div>
                  </div>
                  <div className="grupo-info">
                    <strong>{grupo.nombre || `Grupo ${grupo.id}`}</strong>
                    <small>{grupo.participantes_count} participantes</small>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="info-section">
            <h3>Acciones rápidas</h3>
            <button className="info-action-btn" onClick={() => setShowArchivos(true)}>
              <Paperclip size={14} color="grey" /> Ver archivos compartidos
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
