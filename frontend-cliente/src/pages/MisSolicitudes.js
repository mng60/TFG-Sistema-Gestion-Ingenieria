import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Inbox } from 'lucide-react';
import api from '../services/api';
import { formatearFecha } from '../utils/format';

function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Mis Solicitudes - Portal Cliente';
    api.get('/portal/tickets')
      .then((res) => setSolicitudes((res.data.tickets || []).filter(t => t.tipo === 'solicitud_nuevo_proyecto')))
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
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '20px 24px',
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        border: '1px solid #f0f0f0',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#111827', margin: '0 0 6px', fontWeight: 800, fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.02em' }}>
            Mis Solicitudes
          </h1>
          <p style={{ margin: 0, color: '#6f7d84', fontSize: '1rem' }}>
            Seguimiento de tus propuestas de proyecto enviadas
          </p>
        </div>
      </div>

      {solicitudes.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e8edf1',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Inbox size={40} color="#c5d3da" style={{ marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px', color: '#52626a', fontWeight: 600 }}>Sin solicitudes</h3>
          <p style={{ margin: 0, color: '#8fa0aa', fontSize: '0.95rem' }}>
            Cuando envíes una solicitud de proyecto aparecerá aquí.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {solicitudes.map((sol) => (
            <div
              key={sol.id}
              style={{
                background: 'white',
                borderRadius: 12,
                border: '1px solid #e8edf1',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                padding: '18px 20px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start'
              }}
            >
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {sol.estado === 'resuelto'
                  ? <CheckCircle2 size={20} color="#27ae60" />
                  : <Clock size={20} color="#e67e22" />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: sol.estado === 'resuelto' ? '#eafaf1' : '#fef6ec',
                    color: sol.estado === 'resuelto' ? '#1e8449' : '#b7590a'
                  }}>
                    {sol.estado === 'resuelto' ? 'Atendida' : 'Pendiente'}
                  </span>
                  <span style={{ fontSize: '0.83rem', color: '#8fa0aa' }}>
                    Enviada el {formatearFecha(sol.created_at)}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#52626a', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {sol.mensaje}
                </p>
                {sol.estado === 'resuelto' && sol.resuelto_at && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#27ae60', fontWeight: 600 }}>
                    Atendida el {formatearFecha(sol.resuelto_at)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MisSolicitudes;
