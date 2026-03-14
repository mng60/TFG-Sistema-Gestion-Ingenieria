import React, { useState } from 'react';
import { Trash2, Calendar } from 'lucide-react';
import proyectoService from '../../services/proyectoService';

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

  const formatFecha = (f) => {
    if (!f) return '';
    return new Date(f).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatFechaCorta = (f) => {
    if (!f) return '';
    return new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Botones */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowForm(f => !f)}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: showForm ? '#e0e0e0' : '#4DB6A8', color: showForm ? '#333' : 'white',
            fontWeight: 700, fontSize: '0.88rem'
          }}
        >
          {showForm ? 'Cancelar' : '+ Nueva actualización'}
        </button>
        {!isAdmin && (
          <button
            onClick={handleSolicitud}
            style={{
              padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#e67e22', color: 'white', fontWeight: 700, fontSize: '0.88rem'
            }}
          >
            Solicitar presupuesto
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>Realizado</label>
            <textarea
              value={formData.realizado}
              onChange={e => setFormData(p => ({ ...p, realizado: e.target.value }))}
              rows={3}
              placeholder="¿Qué se ha completado?"
              style={{ border: '1.5px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>Pendiente</label>
            <textarea
              value={formData.pendiente}
              onChange={e => setFormData(p => ({ ...p, pendiente: e.target.value }))}
              rows={3}
              placeholder="¿Qué queda por hacer?"
              style={{ border: '1.5px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: '#2c3e50' }}>
            <input
              type="checkbox"
              checked={formData.sugiere_cambio_fecha}
              onChange={e => setFormData(p => ({ ...p, sugiere_cambio_fecha: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: '#4DB6A8' }}
            />
            Sugerir cambio de fecha de entrega
          </label>
          {formData.sugiere_cambio_fecha && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>Nueva fecha sugerida</label>
              <input
                type="date"
                value={formData.fecha_sugerida}
                onChange={e => setFormData(p => ({ ...p, fecha_sugerida: e.target.value }))}
                style={{ border: '1.5px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: '0.9rem' }}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#4DB6A8', color: 'white', fontWeight: 700, fontSize: '0.95rem'
            }}
          >
            {submitting ? 'Guardando...' : 'Guardar actualización'}
          </button>
        </form>
      )}

      {/* Lista */}
      {actualizaciones.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: '32px 0', fontSize: '0.9rem' }}>
          No hay actualizaciones registradas aún.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {actualizaciones.map(act => (
            <div key={act.id} style={{
              background: 'white', border: '1px solid #eee', borderRadius: 10,
              padding: '12px 14px', position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2c3e50' }}>{act.empleado_nombre}</span>
                  <span style={{ fontSize: '0.75rem', color: '#95a5a6', marginLeft: 8 }}>{formatFecha(act.created_at)}</span>
                </div>
                {(isAdmin || act.empleado_id === empleadoId) && (
                  <button
                    onClick={() => handleDelete(act.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e74c3c', padding: 4, display: 'flex', alignItems: 'center' }}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {act.sugiere_cambio_fecha && (
                <div style={{ background: '#fff3cd', color: '#856404', fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <Calendar size={12} /> Sugiere fecha: {formatFechaCorta(act.fecha_sugerida)}
                </div>
              )}
              {act.realizado && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ background: '#d4edda', color: '#155724', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20 }}>
                    Realizado
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#444', lineHeight: 1.5 }}>{act.realizado}</p>
                </div>
              )}
              {act.pendiente && (
                <div>
                  <span style={{ background: '#fff3cd', color: '#856404', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20 }}>
                    Pendiente
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#444', lineHeight: 1.5 }}>{act.pendiente}</p>
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
