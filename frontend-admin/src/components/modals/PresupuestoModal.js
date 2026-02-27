import React, { useState } from 'react';
import presupuestoService from '../../services/presupuestoService';
import '../../styles/Modal.css';

function PresupuestoModal({ proyectoId, presupuesto, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    numero_presupuesto: presupuesto?.numero_presupuesto || `PRE-${Date.now()}`,
    fecha_emision: presupuesto?.fecha_emision?.split('T')[0] || new Date().toISOString().split('T')[0],
    fecha_validez: presupuesto?.fecha_validez?.split('T')[0] || '',
    subtotal: presupuesto?.subtotal || '',
    iva: presupuesto?.iva || '21',
    descripcion: presupuesto?.descripcion || '',
    condiciones: presupuesto?.condiciones || '',
    notas: presupuesto?.notas || '',
    estado: presupuesto?.estado || 'borrador',
    version: presupuesto?.version || '1'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calcularTotal = () => {
    const sub = parseFloat(formData.subtotal) || 0;
    const ivaVal = parseFloat(formData.iva) || 0;
    return sub * (1 + ivaVal / 100);
  };

  const formatearMoneda = (cantidad) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cantidad);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        ...formData,
        proyecto_id: proyectoId,
        fecha_validez: formData.fecha_validez || null,
        subtotal: parseFloat(formData.subtotal) || 0,
        iva: parseFloat(formData.iva) || 0
      };

      if (presupuesto) {
        await presupuestoService.update(presupuesto.id, dataToSend);
      } else {
        await presupuestoService.create(dataToSend);
      }

      onSuccess();
    } catch (error) {
      onError(error.response?.data?.message || 'Error al guardar presupuesto');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{presupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Número de Presupuesto *</label>
              <input
                type="text"
                name="numero_presupuesto"
                value={formData.numero_presupuesto}
                onChange={handleChange}
                required
                disabled={presupuesto?.aceptado}
              />
            </div>

            <div className="form-group">
              <label>Fecha Emisión *</label>
              <input
                type="date"
                name="fecha_emision"
                value={formData.fecha_emision}
                onChange={handleChange}
                required
                disabled={presupuesto?.aceptado}
              />
            </div>

            <div className="form-group">
              <label>Fecha Validez</label>
              <input
                type="date"
                name="fecha_validez"
                value={formData.fecha_validez}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Subtotal (€) *</label>
              <input
                type="number"
                name="subtotal"
                value={formData.subtotal}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                disabled={presupuesto?.aceptado}
              />
            </div>

            <div className="form-group">
              <label>IVA (%) *</label>
              <select
                name="iva"
                value={formData.iva}
                onChange={handleChange}
                required
                disabled={presupuesto?.aceptado}
              >
                <option value="0">0% (Exento)</option>
                <option value="4">4% (Superreducido)</option>
                <option value="10">10% (Reducido)</option>
                <option value="21">21% (General)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Estado *</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
                disabled={presupuesto?.aceptado}
              >
                <option value="borrador">Borrador</option>
                <option value="enviado">Enviado</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>

            <div className="form-group">
              <label>Versión</label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleChange}
              />
            </div>

            <div className="form-group form-group-full">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-group form-group-full">
              <label>Condiciones</label>
              <textarea
                name="condiciones"
                value={formData.condiciones}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <div className="form-group form-group-full">
              <label>Notas</label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows="2"
              />
            </div>

            {/* Preview del Total */}
            {formData.subtotal && (
              <div className="form-group form-group-full">
                <div className="total-preview">
                  <div className="total-preview-item">
                    <span>Subtotal:</span>
                    <strong>{formatearMoneda(formData.subtotal)}</strong>
                  </div>
                  <div className="total-preview-item">
                    <span>IVA ({formData.iva}%):</span>
                    <strong>{formatearMoneda((parseFloat(formData.subtotal) * parseFloat(formData.iva)) / 100)}</strong>
                  </div>
                  <div className="total-preview-item total-preview-total">
                    <span>TOTAL:</span>
                    <strong>{formatearMoneda(calcularTotal())}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">
              {presupuesto ? 'Guardar Cambios' : 'Crear Presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PresupuestoModal;