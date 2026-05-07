import React, { useState } from 'react';
import presupuestoService from '../services/presupuestoService';
import PresupuestoModal from './modals/PresupuestoModal';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { formatearFecha, formatearMoneda } from '../utils/format';
import '../styles/Modal.css';

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
  const [presupuestoDetalle, setPresupuestoDetalle] = useState(null);

  const abrirModalPresupuesto = (presupuesto = null) => {
    if (presupuesto && presupuesto.aceptado) {
      showToast('No se pueden editar presupuestos aceptados', 'warning');
      return;
    }
    setPresupuestoSeleccionado(presupuesto);
    setShowPresupuestoModal(true);
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
            <Plus size={16}/> Nuevo Presupuesto
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
                <tr key={presupuesto.id} className="tr-clickable" onClick={() => setPresupuestoDetalle(presupuesto)} style={{ cursor: 'pointer' }}>
                  <td>
                    <strong>{presupuesto.numero_presupuesto}</strong>
                    <div className="presupuesto-version">
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
                  <td onClick={e => e.stopPropagation()}>
                    <div className="action-buttons">
                      {!presupuesto.aceptado && proyecto.estado !== 'completado' && (
                        <button
                          className="btn-sm btn-edit"
                          onClick={() => abrirModalPresupuesto(presupuesto)}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {isAdmin && !presupuesto.aceptado && proyecto.estado !== 'completado' && (
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleEliminar(presupuesto)}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
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

      {presupuestoDetalle && (
        <div className="modal-overlay" onClick={() => setPresupuestoDetalle(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h2>Detalle del presupuesto</h2>
              <button className="modal-close" onClick={() => setPresupuestoDetalle(null)}><X size={18} /></button>
            </div>
            <div className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Número</label>
                  <div className="modal-description" style={{ marginBottom: 0 }}>
                    {presupuestoDetalle.numero_presupuesto}
                    <span style={{ marginLeft: 8, fontSize: '0.8rem', opacity: 0.6 }}>v{presupuestoDetalle.version}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <div className="modal-description" style={{ marginBottom: 0 }}>
                    <span className={`badge badge-${presupuestoDetalle.aceptado ? 'aceptado' : presupuestoDetalle.estado}`}>
                      {presupuestoDetalle.aceptado ? 'Aceptado' : presupuestoDetalle.estado}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Fecha emisión</label>
                  <div className="modal-description" style={{ marginBottom: 0 }}>{formatearFecha(presupuestoDetalle.fecha_emision)}</div>
                </div>
                {presupuestoDetalle.fecha_validez && (
                  <div className="form-group">
                    <label>Fecha validez</label>
                    <div className="modal-description" style={{ marginBottom: 0 }}>{formatearFecha(presupuestoDetalle.fecha_validez)}</div>
                  </div>
                )}
                <div className="form-group">
                  <label>Subtotal</label>
                  <div className="modal-description" style={{ marginBottom: 0 }}>{formatearMoneda(presupuestoDetalle.subtotal)}</div>
                </div>
                <div className="form-group">
                  <label>IVA</label>
                  <div className="modal-description" style={{ marginBottom: 0 }}>{presupuestoDetalle.iva}%</div>
                </div>
                <div className="form-group form-group-full">
                  <label>Total</label>
                  <div className="modal-description" style={{ marginBottom: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    {formatearMoneda(presupuestoDetalle.total)}
                  </div>
                </div>
                {presupuestoDetalle.descripcion && (
                  <div className="form-group form-group-full">
                    <label>Descripción</label>
                    <div className="modal-description" style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{presupuestoDetalle.descripcion}</div>
                  </div>
                )}
                {presupuestoDetalle.condiciones && (
                  <div className="form-group form-group-full">
                    <label>Condiciones</label>
                    <div className="modal-description" style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{presupuestoDetalle.condiciones}</div>
                  </div>
                )}
                {presupuestoDetalle.notas && (
                  <div className="form-group form-group-full">
                    <label>Notas internas</label>
                    <div className="modal-description" style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{presupuestoDetalle.notas}</div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setPresupuestoDetalle(null)}>Cerrar</button>
                {!presupuestoDetalle.aceptado && proyecto.estado !== 'completado' && proyecto.estado !== 'cancelado' && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => { setPresupuestoDetalle(null); abrirModalPresupuesto(presupuestoDetalle); }}
                  >
                    <Pencil size={15} /> Editar
                  </button>
                )}
              </div>
            </div>
          </div>
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