import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArchivosPanel from './ArchivosPanel';

function InfoPanelGrupo({ conversacion, currentUser, onClose }) {
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showArchivos, setShowArchivos] = useState(false);

  useEffect(() => {
    if (conversacion.proyecto_id) {
      cargarProyecto();
    } else {
      setLoading(false);
    }
  }, [conversacion]);

  const cargarProyecto = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/portal/proyectos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        const p = (data.proyectos || []).find(p => p.id === conversacion.proyecto_id);
        if (p) setProyecto(p);
      }
    } catch (error) {
      console.error('Error al cargar proyecto:', error);
    } finally {
      setLoading(false);
    }
  };

  const participantes = conversacion.participantes || [];

  if (!conversacion) return null;

  return (
    <div className="info-panel-overlay" onClick={onClose}>
      <div className="info-panel" onClick={(e) => e.stopPropagation()}>
        <div className="info-panel-header">
          <button className="btn-back" onClick={onClose}>← Volver</button>
          <button className="btn-close-panel" onClick={onClose}>✕</button>
        </div>

        <div className="info-panel-content">
          <div className="info-avatar-large">
            <div className="avatar-circle-large">📁</div>
          </div>

          <h2 className="info-name">{conversacion.nombre || 'Grupo'}</h2>
          <p className="info-type">📁 Grupo de Proyecto</p>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#95a5a6' }}>Cargando...</p>
          ) : proyecto ? (
            <div className="info-section">
              <h3>Proyecto</h3>
              <div className="proyecto-info-card">
                <strong>{proyecto.nombre}</strong>
                <span className={`badge badge-${proyecto.estado}`}>
                  {proyecto.estado.replace('_', ' ')}
                </span>
              </div>
            </div>
          ) : null}

          <div className="info-section">
            <h3>Participantes ({participantes.length})</h3>
            <div className="participantes-list">
              {participantes.map((participante, index) => (
                <div
                  key={`${participante.user_id}-${participante.tipo_usuario}-${index}`}
                  className="participante-item"
                >
                  <div className="participante-avatar">
                    {participante.tipo_usuario === 'cliente' ? '🏢' : '👤'}
                  </div>
                  <div className="participante-info">
                    <strong>{participante.nombre}</strong>
                    <small>{participante.tipo_usuario === 'empleado' ? 'Empleado' : 'Cliente'}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="info-section">
            <h3>Acciones rápidas</h3>
            <button className="info-action-btn" onClick={() => setShowArchivos(true)}>
              📎 Ver archivos compartidos
            </button>
            {proyecto && (
              <button
                className="info-action-btn"
                onClick={() => { navigate(`/proyectos/${proyecto.id}`); onClose(); }}
              >
                📁 Ver proyecto completo
              </button>
            )}
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

export default InfoPanelGrupo;
