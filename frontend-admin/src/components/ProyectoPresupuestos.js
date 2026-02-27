import React, { useState } from 'react';
import presupuestoService from '../services/presupuestoService';
import PresupuestoModal from './modals/PresupuestoModal';

function ProyectoPresupuestos({ 
  proyectoId, 
  proyecto,
  presupuestos, 
  isAdmin, 
  onReload, 
  showToast,
  setConfirmModal 
}) {
  const [showPresupuestoModal, setShowPresupuestoModal] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const formatearMoneda = (cantidad) => {
    if (!cantidad) return '0,00 €';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cantidad);
  };

  const abrirModalPresupuesto = (presupuesto = null) => {
    if (presupuesto && presupuesto.aceptado) {
      showToast('No se pueden editar presupuestos aceptados', 'warning');
      return;
    }
    setPresupuestoSeleccionado(presupuesto);
    setShowPresupuestoModal(true);
  };

  const handleAceptar = (presupuesto) => {
    setConfirmModal({
      title: 'Aceptar Presupuesto',
      message: `¿Marcar el presupuesto ${presupuesto.numero_presupuesto} como aceptado?`,
      type: 'info',
      confirmText: 'Aceptar',
      onConfirm: async () => {
        try {
          await presupuestoService.aceptar(presupuesto.id);
          showToast('Presupuesto aceptado', 'success');
          onReload();
        } catch (error) {
          showToast('Error al aceptar presupuesto', 'error');
        }
      }
    });
  };

  const handleRechazar = (presupuesto) => {
    setConfirmModal({
      title: 'Rechazar Presupuesto',
      message: `¿Marcar el presupuesto ${presupuesto.numero_presupuesto} como rechazado?`,
      type: 'warning',
      confirmText: 'Rechazar',
      onConfirm: async () => {
        try {
          await presupuestoService.rechazar(presupuesto.id);
          showToast('Presupuesto rechazado', 'success');
          onReload();
        } catch (error) {
          showToast('Error al rechazar presupuesto', 'error');
        }
      }
    });
  };

  const handleEliminar = (presupuesto) => {
    if (presupuesto.aceptado) {
      showToast('No se pueden eliminar presupuestos aceptados', 'error');
      return;
    }

    setConfirmModal({
      title: '⚠️ Eliminar Presupuesto',
      message: `¿Eliminar el presupuesto ${presupuesto.numero_presupuesto}?`,
      type: 'danger',
      confirmText: 'Sí, Eliminar',
      onConfirm: async () => {
        try {
          await presupuestoService.delete(presupuesto.id);
          showToast('Presupuesto eliminado', 'success');
          onReload();
        } catch (error) {
          showToast('Error al eliminar presupuesto', 'error');
        }
      }
    });
  };

  return (
    <div className="tab-panel">
      <div className="section-header">
        <h2>Presupuestos del Proyecto</h2>
        {isAdmin && proyecto.estado !== 'completado' && proyecto.estado !== 'cancelado' && (
          <button className="btn-primary" onClick={() => abrirModalPresupuesto()}>
            ➕ Nuevo Presupuesto
          </button>
        )}
      </div>

      {presupuestos.length === 0 ? (
        <p className="empty-message">No hay presupuestos para este proyecto</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha Emisión</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((presupuesto) => (
                <tr key={presupuesto.id}>
                  <td>
                    <strong>{presupuesto.numero_presupuesto}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                      v{presupuesto.version}
                    </div>
                  </td>
                  <td>{formatearFecha(presupuesto.fecha_emision)}</td>
                  <td>{formatearMoneda(presupuesto.subtotal)}</td>
                  <td>{presupuesto.iva}%</td>
                  <td><strong>{formatearMoneda(presupuesto.total)}</strong></td>
                  <td>
                    <span className={`badge badge-${presupuesto.estado}`}>
                      {presupuesto.aceptado ? 'Aceptado' : presupuesto.estado}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!presupuesto.aceptado && proyecto.estado !== 'completado' && (
                        <button
                          className="btn-sm btn-edit"
                          onClick={() => abrirModalPresupuesto(presupuesto)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                      )}
                      {isAdmin && presupuesto.estado === 'enviado' && !presupuesto.aceptado && (
                        <>
                          <button
                            className="btn-sm btn-success"
                            onClick={() => handleAceptar(presupuesto)}
                            title="Aceptar"
                          >
                            ✓
                          </button>
                          <button
                            className="btn-sm btn-warning"
                            onClick={() => handleRechazar(presupuesto)}
                            title="Rechazar"
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {isAdmin && !presupuesto.aceptado && proyecto.estado !== 'completado' && (
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleEliminar(presupuesto)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPresupuestoModal && (
        <PresupuestoModal
          proyectoId={proyectoId}
          presupuesto={presupuestoSeleccionado}
          onClose={() => {
            setShowPresupuestoModal(false);
            setPresupuestoSeleccionado(null);
          }}
          onSuccess={() => {
            showToast(presupuestoSeleccionado ? 'Presupuesto actualizado' : 'Presupuesto creado', 'success');
            setShowPresupuestoModal(false);
            setPresupuestoSeleccionado(null);
            onReload();
          }}
          onError={(error) => showToast(error, 'error')}
        />
      )}
    </div>
  );
}

export default ProyectoPresupuestos;