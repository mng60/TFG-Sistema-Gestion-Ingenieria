import React, { useState } from 'react';
import proyectoService from '../services/proyectoService';
import EditarProyectoModal from './modals/EditarProyectoModal';
import AsignarEmpleadoModal from './modals/AsignarEmpleadoModal';

function ProyectoInfo({ 
  proyecto, 
  empleadosProyecto, 
  clientes, 
  usuarios, 
  isAdmin, 
  onReload, 
  onReloadEmpleados,
  showToast,
  setConfirmModal 
}) {
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const handleDesasignarEmpleado = (empleado) => {
    setConfirmModal({
      title: 'Desasignar Empleado',
      message: `¿Desasignar a ${empleado.empleado_nombre || empleado.nombre} del proyecto?`,
      type: 'warning',
      confirmText: 'Desasignar',
      onConfirm: async () => {
        try {
          await proyectoService.desasignarEmpleado(proyecto.id, empleado.user_id);
          showToast('Empleado desasignado exitosamente', 'success');
          onReloadEmpleados();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al desasignar empleado', 'error');
        }
      }
    });
  };

  const abrirModalEditar = () => {
    if (proyecto.estado === 'completado' || proyecto.estado === 'cancelado') {
      showToast('No se pueden editar proyectos finalizados', 'warning');
      return;
    }
    setShowEditarModal(true);
  };

  return (
    <div className="tab-panel">
      {/* Botón Editar */}
      {isAdmin && proyecto.estado !== 'completado' && proyecto.estado !== 'cancelado' && (
        <div style={{ marginBottom: '20px', textAlign: 'right' }}>
          <button className="btn-primary" onClick={abrirModalEditar}>
            ✏️ Editar Proyecto
          </button>
        </div>
      )}

      {/* Información General */}
      <section className="info-section">
        <h2>Información General</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Cliente:</label>
            <span>{proyecto.cliente_nombre}</span>
          </div>
          <div className="info-item">
            <label>Responsable:</label>
            <span>{proyecto.responsable_nombre || 'Sin asignar'}</span>
          </div>
          {proyecto.ubicacion && (
            <div className="info-item info-item-full">
              <label>📍 Ubicación:</label>
              <span>{proyecto.ubicacion}</span>
            </div>
          )}
          <div className="info-item">
            <label>Fecha Inicio:</label>
            <span>{formatearFecha(proyecto.fecha_inicio)}</span>
          </div>
          <div className="info-item">
            <label>Fecha Fin Estimada:</label>
            <span>{formatearFecha(proyecto.fecha_fin_estimada)}</span>
          </div>
          {proyecto.fecha_fin_real && (
            <div className="info-item">
              <label>Fecha Fin Real:</label>
              <span>{formatearFecha(proyecto.fecha_fin_real)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Descripción */}
      {proyecto.descripcion && (
        <section className="info-section">
          <h2>Descripción</h2>
          <p className="info-descripcion">{proyecto.descripcion}</p>
        </section>
      )}

      {/* Empleados Asignados */}
      <section className="info-section">
        <div className="section-header">
          <h2>Empleados Asignados ({empleadosProyecto.length})</h2>
          {isAdmin && (
            <button className="btn-secondary" onClick={() => setShowAsignarModal(true)}>
              ➕ Asignar Empleado
            </button>
          )}
        </div>
        {empleadosProyecto.length === 0 ? (
          <p className="empty-message-small">No hay empleados asignados</p>
        ) : (
          <div className="empleados-grid">
            {empleadosProyecto.map(emp => (
              <div key={emp.id} className="empleado-card">
                <div className="empleado-avatar">👤</div>
                <div className="empleado-info">
                  <strong>{emp.empleado_nombre || emp.nombre}</strong>
                  <span className="empleado-rol">{emp.rol_proyecto}</span>
                </div>
                {isAdmin && (
                  <button
                    className="btn-desasignar"
                    onClick={() => handleDesasignarEmpleado(emp)}
                    title="Desasignar"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notas */}
      {proyecto.notas && (
        <section className="info-section">
          <h2>Notas</h2>
          <p className="info-notas">{proyecto.notas}</p>
        </section>
      )}

      {/* Modales */}
      {showEditarModal && (
        <EditarProyectoModal
          proyecto={proyecto}
          clientes={clientes}
          usuarios={usuarios}
          onClose={() => setShowEditarModal(false)}
          onSuccess={() => {
            showToast('Proyecto actualizado exitosamente', 'success');
            setShowEditarModal(false);
            onReload();
          }}
          onError={(error) => showToast(error, 'error')}
        />
      )}

      {showAsignarModal && (
        <AsignarEmpleadoModal
          proyectoId={proyecto.id}
          usuarios={usuarios}
          onClose={() => setShowAsignarModal(false)}
          onSuccess={() => {
            showToast('Empleado asignado exitosamente', 'success');
            setShowAsignarModal(false);
            onReloadEmpleados();
          }}
          onError={(error) => showToast(error, 'error')}
        />
      )}
    </div>
  );
}

export default ProyectoInfo;