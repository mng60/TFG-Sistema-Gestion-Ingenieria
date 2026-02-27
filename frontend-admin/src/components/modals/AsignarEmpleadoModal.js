import React, { useState } from 'react';
import proyectoService from '../../services/proyectoService';
import '../../styles/Modal.css';

function AsignarEmpleadoModal({ proyectoId, usuarios, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    user_id: '',
    rol_proyecto: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await proyectoService.asignarEmpleado(proyectoId, formData);
      onSuccess();
    } catch (error) {
      onError(error.response?.data?.message || 'Error al asignar empleado');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Asignar Empleado</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Empleado *</label>
            <select name="user_id" value={formData.user_id} onChange={handleChange} required>
              <option value="">Seleccionar...</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Rol en el Proyecto *</label>
            <input
              type="text"
              name="rol_proyecto"
              value={formData.rol_proyecto}
              onChange={handleChange}
              placeholder="Ej: Ingeniero eléctrico principal"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Asignar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AsignarEmpleadoModal;