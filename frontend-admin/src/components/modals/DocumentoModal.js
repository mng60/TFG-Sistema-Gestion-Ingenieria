import React, { useState } from 'react';
import '../../styles/Modal.css';
import axios from 'axios';

function DocumentoModal({ proyectoId, onClose, onSuccess, onError }) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    tipo_documento: 'otro',
    nombre: '',
    descripcion: '',
    version: '1',
    es_publico: false,
    archivo: null
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('El archivo no puede superar los 10MB');
      e.target.value = '';
      return;
    }

    setFormData({
      ...formData,
      archivo: file,
      nombre: formData.nombre || file.name
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.archivo) {
      onError('Debes seleccionar un archivo');
      return;
    }

    setUploading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');

      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.archivo);
      formDataToSend.append('proyecto_id', proyectoId);
      formDataToSend.append('tipo_documento', formData.tipo_documento);
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('version', formData.version);
      formDataToSend.append('es_publico', formData.es_publico);

      const response = await axios.post(
        `${API_URL}/documentos/upload`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      onSuccess();
    } catch (error) {
      console.error('❌ Error upload:', error.response?.data || error.message);
      onError(error.response?.data?.message || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !uploading && onClose()}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Subir Documento</h2>
          <button className="modal-close" onClick={onClose} disabled={uploading}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Archivo *</label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              disabled={uploading}
            />
            <small style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
              Maximo 10MB
            </small>
          </div>

          <div className="form-group">
            <label>Nombre del Documento *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              disabled={uploading}
              placeholder="Ej: Plano electrico principal"
            />
          </div>

          <div className="form-group">
            <label>Tipo de Documento *</label>
            <select
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
              required
              disabled={uploading}
            >
              <option value="esquema">Esquema</option>
              <option value="plano">Plano</option>
              <option value="contrato">Contrato</option>
              <option value="informe">Informe</option>
              <option value="foto">Foto</option>
              <option value="certificado">Certificado</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Descripcion</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="3"
              disabled={uploading}
              placeholder="Descripcion del documento..."
            />
          </div>

          <div className="form-group">
            <label>Version</label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleChange}
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="es_publico"
                checked={formData.es_publico}
                onChange={handleChange}
                disabled={uploading}
              />
              <span>Visible para el cliente</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={uploading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Subir Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DocumentoModal;