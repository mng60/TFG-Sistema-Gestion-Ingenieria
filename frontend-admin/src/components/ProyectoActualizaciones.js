import React, { useState } from 'react';
import axios from 'axios';
import { CalendarClock, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import '../styles/ProyectoActualizaciones.css';
import { getAvatarSrc } from '../utils/format';
import { formatearFecha, formatearFechaHora } from '../utils/format';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ProyectoActualizaciones({ proyectoId, actualizaciones, isAdmin, onReload, showToast }) {
  const { empleado } = useEmpleadoAuth();
  const [showForm, setShowForm] = useState(false);
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [solicitudSubmitting, setSolicitudSubmitting] = useState(false);
  const [solicitudMotivo, setSolicitudMotivo] = useState('');
  const [formData, setFormData] = useState({
    realizado: '',
    pendiente: '',
    sugiere_cambio_fecha: false,
    fecha_sugerida: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.realizado && !formData.pendiente) {
      showToast('Indica al menos que se ha realizado o que queda pendiente', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('empleado_token');
      await axios.post(`${API_URL}/proyectos/${proyectoId}/actualizaciones`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormData({
        realizado: '',
        pendiente: '',
        sugiere_cambio_fecha: false,
        fecha_sugerida: ''
      });
      setShowForm(false);
      showToast('Actualizacion registrada', 'success');
      onReload();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (actId) => {
    try {
      const token = localStorage.getItem('empleado_token');
      await axios.delete(`${API_URL}/proyectos/${proyectoId}/actualizaciones/${actId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Actualizacion eliminada', 'success');
      onReload();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  const handleSolicitudPresupuesto = async (e) => {
    e.preventDefault();

    if (!solicitudMotivo.trim()) {
      showToast('Explica brevemente por que solicitas el presupuesto', 'error');
      return;
    }

    setSolicitudSubmitting(true);

    try {
      const token = localStorage.getItem('empleado_token');
      await axios.post(
        `${API_URL}/tickets/solicitud`,
        {
          proyecto_id: proyectoId,
          mensaje: [
            `Solicitud de nuevo presupuesto para el proyecto por ${empleado?.nombre || 'empleado'}.`,
            '',
            'Motivo:',
            solicitudMotivo.trim()
          ].join('\n')
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSolicitudMotivo('');
      setShowSolicitudModal(false);
      showToast('Solicitud de presupuesto enviada al administrador', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al enviar solicitud', 'error');
    } finally {
      setSolicitudSubmitting(false);
    }
  };

  const getAvatar = (actualizacion) => {
    if (getAvatarSrc(actualizacion.empleado_foto)) {
      return (
        <img
          src={getAvatarSrc(actualizacion.empleado_foto)}
          alt={actualizacion.empleado_nombre}
          className="act-avatar-img"
        />
      );
    }

    return (
      <span className="act-avatar-initial">
        {(actualizacion.empleado_nombre || 'U').charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <div className="tab-panel actualizaciones-panel">
      <div className="section-header act-header">
        <h2>Registro de Avance</h2>

        <div className="act-header-actions">
          {!isAdmin && (
            <button
              className="btn-warning act-action-btn"
              onClick={() => setShowSolicitudModal(true)}
              title="Solicitar nuevo presupuesto al admin"
            >
              Solicitar presupuesto
            </button>
          )}

          <button className="btn-primary act-action-btn" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancelar' : 'Nueva actualizacion'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="act-form" onSubmit={handleSubmit}>
          <div className="act-form-grid">
            <div className="form-group">
              <label>Que se ha realizado?</label>
              <textarea
                name="realizado"
                value={formData.realizado}
                onChange={handleChange}
                rows={3}
                placeholder="Describe el trabajo completado..."
              />
            </div>

            <div className="form-group">
              <label>Que queda pendiente?</label>
              <textarea
                name="pendiente"
                value={formData.pendiente}
                onChange={handleChange}
                rows={3}
                placeholder="Indica las tareas pendientes..."
              />
            </div>
          </div>

          <div className="act-form-footer">
            <label className="act-check-label">
              <input
                type="checkbox"
                name="sugiere_cambio_fecha"
                checked={formData.sugiere_cambio_fecha}
                onChange={handleChange}
              />
              Sugerir cambio de fecha de entrega
            </label>

            {formData.sugiere_cambio_fecha && (
              <div className="form-group act-fecha-group">
                <label>Nueva fecha sugerida</label>
                <input
                  type="date"
                  name="fecha_sugerida"
                  value={formData.fecha_sugerida}
                  onChange={handleChange}
                />
              </div>
            )}

            <button type="submit" className="btn-primary act-submit-btn" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar actualizacion'}
            </button>
          </div>
        </form>
      )}

      {showSolicitudModal && (
        <div className="modal-overlay" onClick={() => !solicitudSubmitting && setShowSolicitudModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Solicitar presupuesto</h2>
              <button className="modal-close" onClick={() => setShowSolicitudModal(false)}>x</button>
            </div>

            <form className="modal-form" onSubmit={handleSolicitudPresupuesto}>

              <div className="form-group">
                <label>Motivo de la solicitud *</label>
                <textarea
                  className="act-solicitud-textarea"
                  value={solicitudMotivo}
                  onChange={(e) => setSolicitudMotivo(e.target.value)}
                  placeholder="Indica cambios de alcance, nuevas necesidades del cliente, materiales extra o cualquier contexto relevante."
                  rows={6}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowSolicitudModal(false)}
                  disabled={solicitudSubmitting}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={solicitudSubmitting}>
                  {solicitudSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actualizaciones.length === 0 ? (
        <p className="empty-message-small act-empty-message">No hay actualizaciones registradas aun.</p>
      ) : (
        <div className="act-list">
          {actualizaciones.map((act) => (
            <div key={act.id} className="act-item">
              <div className="act-item-avatar">{getAvatar(act)}</div>

              <div className="act-item-body">
                <div className="act-item-meta">
                  <span className="act-autor">{act.empleado_nombre}</span>
                  <span className="act-fecha">{formatearFechaHora(act.created_at)}</span>
                  {act.sugiere_cambio_fecha && (
                    <span className="act-badge-fecha">
                      <CalendarClock size={12} /> Sugiere fecha: {formatearFecha(act.fecha_sugerida)}
                    </span>
                  )}
                </div>

                {act.realizado && (
                  <div className="act-bloque">
                    <span className="act-bloque-label realizado">Realizado</span>
                    <p>{act.realizado}</p>
                  </div>
                )}

                {act.pendiente && (
                  <div className="act-bloque">
                    <span className="act-bloque-label pendiente">Pendiente</span>
                    <p>{act.pendiente}</p>
                  </div>
                )}
              </div>

              {(isAdmin || act.empleado_id === empleado?.id) && (
                <button className="act-delete-btn" onClick={() => handleDelete(act.id)} title="Eliminar">
                  <Trash2 size={15} color="#e74c3c" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProyectoActualizaciones;
