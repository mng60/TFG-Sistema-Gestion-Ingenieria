import React, { useState } from 'react';
import proyectoService from '../../services/proyectoService';
import '../../styles/Modal.css';

function EditarProyectoModal({ proyecto, clientes, usuarios, onClose, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    nombre: proyecto.nombre || '',
    descripcion: proyecto.descripcion || '',
    cliente_id: proyecto.cliente_id || '',
    estado: proyecto.estado || 'pendiente',
    prioridad: proyecto.prioridad || 'media',
    fecha_inicio: proyecto.fecha_inicio?.split('T')[0] || '',
    fecha_fin_estimada: proyecto.fecha_fin_estimada?.split('T')[0] || '',
    fecha_fin_real: proyecto.fecha_fin_real?.split('T')[0] || '',
    responsable_id: proyecto.responsable_id || '',
    ubicacion: proyecto.ubicacion || '',
    notas: proyecto.notas || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        ...formData,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin_estimada: formData.fecha_fin_estimada || null,
        fecha_fin_real: formData.fecha_fin_real || null,
        responsable_id: formData.responsable_id || null
      };

      await proyectoService.update(proyecto.id, dataToSend);
      onSuccess();
    } catch (error) {
      onError(error.response?.data?.message || 'Error al actualizar proyecto');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Proyecto</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group form-group-full">
              <label>Nombre del Proyecto *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>

            <div className="form-group form-group-full">
              <label>Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" />
            </div>

            <div className="form-group">
              <label>Cliente *</label>
              <select name="cliente_id" value={formData.cliente_id} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Responsable</label>
              <select name="responsable_id" value={formData.responsable_id} onChange={handleChange}>
                <option value="">Sin asignar...</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Estado *</label>
              <select name="estado" value={formData.estado} onChange={handleChange} required>
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="pausado">Pausado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prioridad *</label>
              <select name="prioridad" value={formData.prioridad} onChange={handleChange} required>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fecha Inicio</label>
              <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Fecha Fin Estimada</label>
              <input type="date" name="fecha_fin_estimada" value={formData.fecha_fin_estimada} onChange={handleChange} />
            </div>

            <div className="form-group form-group-full">
              <label>Ubicación</label>
              <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} />
            </div>

            <div className="form-group form-group-full">
              <label>Notas</label>
              <textarea name="notas" value={formData.notas} onChange={handleChange} rows="3" />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarProyectoModal;