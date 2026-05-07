import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Inbox, Plus, X } from 'lucide-react';
import api from '../services/api';
import { formatearFecha } from '../utils/format';
import '../styles/MisSolicitudes.css';

function parseMensaje(mensaje = '') {
  const lines = mensaje.split('\n');
  const tipo = lines[0]?.replace('Tipo de proyecto: ', '').trim() || 'Solicitud de proyecto';
  const ubicacion = lines[1]?.replace('Ubicacion: ', '').trim() || '';
  const emptyIdx = lines.findIndex((l, i) => i >= 2 && l.trim() === '');
  const descripcion = emptyIdx >= 0 ? lines.slice(emptyIdx + 1).join('\n').trim() : '';
  return { tipo, ubicacion, descripcion };
}

function SolicitudModal({ sol, onClose }) {
  const { tipo, ubicacion, descripcion } = parseMensaje(sol.mensaje);
  const atendida = sol.estado === 'resuelto';

  return (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div className="ms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ms-modal-header">
          <h2>Detalle de la solicitud</h2>
          <button className="ms-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="ms-modal-body">
          <div className="ms-modal-section">
            <p className="ms-modal-section-title">Tu solicitud</p>
            <div className="ms-modal-field">
              <label>Tipo de proyecto</label>
              <p>{tipo}</p>
            </div>
            {ubicacion && ubicacion !== 'No indicada' && (
              <div className="ms-modal-field">
                <label>Ubicación</label>
                <p>{ubicacion}</p>
              </div>
            )}
            {descripcion && (
              <div className="ms-modal-field">
                <label>Descripción</label>
                <p>{descripcion}</p>
              </div>
            )}
            <div className="ms-modal-field">
              <label>Enviada el</label>
              <p>{formatearFecha(sol.created_at)}</p>
            </div>
          </div>

          <div className="ms-divider" />

          <div className="ms-modal-section">
            <p className="ms-modal-section-title">Respuesta</p>
            {atendida ? (
              <>
                <div className="ms-modal-resolved">
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div className="ms-modal-resolved-body">
                    <p>Solicitud atendida el {formatearFecha(sol.resuelto_at)}</p>
                  </div>
                </div>
                {sol.nota_resolucion && (
                  <div className="ms-modal-field">
                    <label>Nota del administrador</label>
                    <p>{sol.nota_resolucion}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="ms-modal-pending">
                <Clock size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
                <p>Tu solicitud está siendo revisada. Nos pondremos en contacto contigo en breve.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalSol, setModalSol] = useState(null);

  useEffect(() => {
    document.title = 'Mis Solicitudes - Portal Cliente';
    api.get('/portal/tickets')
      .then((res) => setSolicitudes((res.data.tickets || []).filter((t) => t.tipo === 'solicitud_nuevo_proyecto')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="mis-solicitudes-page">
      <div className="ms-page-header">
        <div>
          <h1>Mis Solicitudes</h1>
          <p>Seguimiento de tus propuestas de proyecto enviadas</p>
        </div>
        <Link to="/solicitar-proyecto" className="ms-nueva-btn">
          <Plus size={16} /> Nueva solicitud
        </Link>
      </div>

      {solicitudes.length === 0 ? (
        <div className="ms-empty">
          <Inbox size={40} color="#c5d3da" style={{ marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px', color: '#52626a', fontWeight: 600 }}>Sin solicitudes</h3>
          <p style={{ margin: '0 0 20px', color: '#8fa0aa', fontSize: '0.95rem' }}>
            Cuando envíes una solicitud de proyecto aparecerá aquí.
          </p>
          <Link to="/solicitar-proyecto" className="ms-nueva-btn" style={{ display: 'inline-flex' }}>
            <Plus size={16} /> Solicitar proyecto
          </Link>
        </div>
      ) : (
        <div className="ms-list">
          {solicitudes.map((sol) => {
            const { tipo } = parseMensaje(sol.mensaje);
            const atendida = sol.estado === 'resuelto';
            return (
              <div key={sol.id} className="ms-card" onClick={() => setModalSol(sol)}>
                <div className="ms-card-left">
                  <p className="ms-card-tipo">{tipo}</p>
                  <div className="ms-card-meta">
                    <span className={`ms-badge ${atendida ? 'ms-badge--atendida' : 'ms-badge--pendiente'}`}>
                      {atendida ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {atendida ? 'Atendida' : 'Pendiente'}
                    </span>
                    <span className="ms-card-fecha">Enviada el {formatearFecha(sol.created_at)}</span>
                    {atendida && sol.resuelto_at && (
                      <span className="ms-card-atendida">· Atendida el {formatearFecha(sol.resuelto_at)}</span>
                    )}
                  </div>
                </div>
                <span className="ms-card-arrow">Ver detalles →</span>
              </div>
            );
          })}
        </div>
      )}

      {modalSol && <SolicitudModal sol={modalSol} onClose={() => setModalSol(null)} />}
    </div>
  );
}

export default MisSolicitudes;
