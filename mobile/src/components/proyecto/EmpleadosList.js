import React, { useState, useEffect } from 'react';
import proyectoService from '../../services/proyectoService';
import usuarioService from '../../services/usuarioService';
import ConfirmModal from '../common/ConfirmModal';
import '../../styles/Modal.css';

function AsignarModal({ proyectoId, onClose, onSuccess }) {
  const [empleados, setEmpleados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [rolProyecto, setRolProyecto] = useState('técnico');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usuarioService.getEmpleadosChat().then((d) => setEmpleados(d.empleados || []));
  }, []);

  const handleAsignar = async () => {
    if (!seleccionado) return;
    setLoading(true);
    try {
      await proyectoService.asignarEmpleado(proyectoId, {
        user_id: seleccionado.id,
        rol_proyecto: rolProyecto
      });
      onSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Asignar Empleado</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label>Rol en el proyecto</label>
            <input
              type="text"
              value={rolProyecto}
              onChange={(e) => setRolProyecto(e.target.value)}
              placeholder="ej. técnico, supervisor..."
            />
          </div>
          <div className="form-group">
            <label>Seleccionar empleado</label>
          </div>
          <div className="empleados-picker">
            {empleados.map((emp) => (
              <div
                key={emp.id}
                className={`empleado-picker-item ${seleccionado?.id === emp.id ? 'selected' : ''}`}
                onClick={() => setSeleccionado(emp)}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, flexShrink: 0
                }}>
                  {(emp.nombre || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{emp.nombre}</div>
                  <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>{emp.email}</div>
                </div>
                {seleccionado?.id === emp.id && <span style={{ marginLeft: 'auto', color: '#667eea' }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleAsignar} disabled={!seleccionado || loading}>
            {loading ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmpleadosList({ proyectoId, empleados, isAdmin, onReload, showToast }) {
  const [showAsignar, setShowAsignar] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const handleDesasignar = (emp) => {
    setConfirmModal({
      title: 'Desasignar Empleado',
      message: `¿Desasignar a ${emp.empleado_nombre || emp.nombre} del proyecto?`,
      type: 'warning',
      confirmText: 'Desasignar',
      onConfirm: async () => {
        try {
          await proyectoService.desasignarEmpleado(proyectoId, emp.user_id);
          showToast('Empleado desasignado', 'success');
          onReload();
        } catch {
          showToast('Error al desasignar', 'error');
        }
      }
    });
  };

  return (
    <div>
      <div className="tab-section-header">
        <h3>Equipo ({empleados.length})</h3>
        {isAdmin && (
          <button className="btn-asignar" onClick={() => setShowAsignar(true)}>
            ➕ Asignar
          </button>
        )}
      </div>

      {empleados.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <p>No hay empleados asignados</p>
        </div>
      ) : (
        empleados.map((emp) => (
          <div key={emp.user_id || emp.id} className="empleado-card-m">
            <div className="empleado-avatar-m">
              {(emp.empleado_nombre || emp.nombre || '?').charAt(0).toUpperCase()}
            </div>
            <div className="empleado-info-m">
              <div className="empleado-nombre-m">{emp.empleado_nombre || emp.nombre}</div>
              <div className="empleado-rol-m">{emp.rol_proyecto || emp.rol}</div>
            </div>
            {isAdmin && (
              <button
                className="btn-desasignar-m"
                onClick={() => handleDesasignar(emp)}
                title="Desasignar"
              >
                ✕
              </button>
            )}
          </div>
        ))
      )}

      {showAsignar && (
        <AsignarModal
          proyectoId={proyectoId}
          onClose={() => setShowAsignar(false)}
          onSuccess={() => {
            setShowAsignar(false);
            showToast('Empleado asignado', 'success');
            onReload();
          }}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          {...confirmModal}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

export default EmpleadosList;
