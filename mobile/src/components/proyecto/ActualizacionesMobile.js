import React, { useState } from 'react';
import { Trash2, Calendar } from 'lucide-react';
import proyectoService from '../../services/proyectoService';
import { formatearFecha, formatearFechaHora } from '../../utils/format';

function ActualizacionesMobile({ proyectoId, actualizaciones, isAdmin, empleadoId, onReload, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    realizado: '',
    pendiente: '',
    sugiere_cambio_fecha: false,
    fecha_sugerida: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.realizado && !formData.pendiente) {
      showToast('Indica al menos qué se ha realizado o qué queda pendiente', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await proyectoService.createActualizacion(proyectoId, formData);
      setFormData({ realizado: '', pendiente: '', sugiere_cambio_fecha: false, fecha_sugerida: '' });
      setShowForm(false);
      showToast('Actualización registrada', 'success');
      onReload();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (actId) => {
    try {
      await proyectoService.deleteActualizacion(proyectoId, actId);
      showToast('Actualización eliminada', 'success');
      onReload();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  const handleSolicitud = async () => {
    try {
      const { default: api } = await import('../../services/api');
      await api.post('/tickets/solicitud', {
        proyecto_id: proyectoId,
        mensaje: 'Solicitud de nuevo presupuesto para el proyecto'
      });
      showToast('Solicitud de presupuesto enviada', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al enviar solicitud', 'error');
    }
  };

  return (
    <div className="actualizaciones-mobile">
      <div className="actualizaciones-actions">
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className={`btn-asignar ${showForm ? 'btn-cancel-update' : ''}`}
        >
          {showForm ? 'Cancelar' : '+ Nueva actualización'}
        </button>

        {!isAdmin && (
          <button onClick={handleSolicitud} className="btn-warning-chip">
            Solicitar presupuesto
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="actualizacion-form">
          <div className="form-group">
            <label>Realizado</label>
            <textarea
              value={formData.realizado}
              onChange={(e) => setFormData((prev) => ({ ...prev, realizado: e.target.value }))}
              rows={3}
              placeholder="¿Qué se ha completado?"
            />
          </div>

          <div className="form-group">
            <label>Pendiente</label>
            <textarea
              value={formData.pendiente}
              onChange={(e) => setFormData((prev) => ({ ...prev, pendiente: e.target.value }))}
              rows={3}
              placeholder="¿Qué queda por hacer?"
            />
          </div>

          <label className="actualizacion-checkbox">
            <input
              type="checkbox"
              checked={formData.sugiere_cambio_fecha}
              onChange={(e) => setFormData((prev) => ({ ...prev, sugiere_cambio_fecha: e.target.checked }))}
            />
            Sugerir cambio de fecha de entrega
          </label>

          {formData.sugiere_cambio_fecha && (
            <div className="form-group">
              <label>Nueva fecha sugerida</label>
              <input
                type="date"
                value={formData.fecha_sugerida}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData((prev) => ({ ...prev, fecha_sugerida: e.target.value }))}
              />
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary btn-save-update">
            {submitting ? 'Guardando...' : 'Guardar actualización'}
          </button>
        </form>
      )}

      {actualizaciones.length === 0 ? (
        <div className="empty-state">
          <p>No hay actualizaciones registradas aún.</p>
        </div>
      ) : (
        <div className="actualizaciones-list">
          {actualizaciones.map((act) => (
            <div key={act.id} className="actualizacion-card">
              <div className="actualizacion-card-header">
                <div className="actualizacion-card-author">
                  <strong>{act.empleado_nombre}</strong>
                  <span>{formatearFechaHora(act.created_at)}</span>
                </div>

                {(isAdmin || act.empleado_id === empleadoId) && (
                  <button onClick={() => handleDelete(act.id)} className="btn-delete-update" title="Eliminar">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {act.sugiere_cambio_fecha && (
                <div className="actualizacion-date-chip">
                  <Calendar size={12} />
                  <span>Sugiere fecha: {formatearFecha(act.fecha_sugerida)}</span>
                </div>
              )}

              {act.realizado && (
                <div className="actualizacion-block">
                  <span className="actualizacion-tag actualizacion-tag-done">Realizado</span>
                  <p>{act.realizado}</p>
                </div>
              )}

              {act.pendiente && (
                <div className="actualizacion-block">
                  <span className="actualizacion-tag actualizacion-tag-pending">Pendiente</span>
                  <p>{act.pendiente}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActualizacionesMobile;
