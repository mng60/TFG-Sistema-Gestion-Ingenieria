import React, { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import proyectoService from '../../services/proyectoService';
import usuarioService from '../../services/usuarioService';
import ConfirmModal from '../common/ConfirmModal';
import { getAvatarInitial } from '../../utils/format';
import '../../styles/Modal.css';

function AsignarModal({ proyectoId, empleadosAsignados, onClose, onSuccess }) {
  const [empleados, setEmpleados] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [rolProyecto, setRolProyecto] = useState('técnico');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usuarioService.getEmpleadosChat().then((d) => setEmpleados(d.users || d.empleados || []));
  }, []);

  const idsAsignados = new Set(empleadosAsignados.map(e => e.user_id || e.id));

  const empleadosFiltrados = empleados.filter(emp => !idsAsignados.has(emp.id));

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
            {empleadosFiltrados.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.88rem', padding: '20px 0' }}>
                Todos los empleados ya están asignados
              </p>
            ) : (
              empleadosFiltrados.map((emp) => (
                <div
                  key={emp.id}
                  className={`empleado-picker-item ${seleccionado?.id === emp.id ? 'selected' : ''}`}
                  onClick={() => setSeleccionado(emp)}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4DB6A8, #3A9089)',
                    color: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, flexShrink: 0
                  }}>
                    {getAvatarInitial(emp.nombre)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{emp.nombre}</div>
                    <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>{emp.email}</div>
                  </div>
                  {seleccionado?.id === emp.id && <span style={{ marginLeft: 'auto', color: '#4DB6A8' }}>✓</span>}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleAsignar} disabled={!seleccionado || loading}>
            <Plus size={15} /> {loading ? 'Asignando...' : 'Asignar'}
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
          <button className="btn-asignar" onClick={() => setShowAsignar(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> Asignar
          </button>
        )}
      </div>

      {empleados.length === 0 ? (
        <div className="empty-state">
          <Users size={44} color="#ccc" />
          <p>No hay empleados asignados</p>
        </div>
      ) : (
        empleados.map((emp) => (
          <div key={emp.user_id || emp.id} className="empleado-card-m">
            <div className="empleado-avatar-m">
              {getAvatarInitial(emp.empleado_nombre || emp.nombre)}
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
          empleadosAsignados={empleados}
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
