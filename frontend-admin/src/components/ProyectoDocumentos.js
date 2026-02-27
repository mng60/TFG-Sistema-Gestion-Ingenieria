import React, { useState } from 'react';
import DocumentoModal from './modals/DocumentoModal';
import axios from 'axios';

function ProyectoDocumentos({ 
  proyectoId, 
  documentos, 
  isAdmin, 
  onReload, 
  showToast,
  setConfirmModal 
}) {
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const formatearTamano = (bytes) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const getIconoTipo = (tipo) => {
    const iconos = {
      esquema: '📐',
      plano: '📏',
      contrato: '📜',
      informe: '📊',
      foto: '📸',
      certificado: '🏆',
      otro: '📄'
    };
    return iconos[tipo] || '📄';
  };

  const handleDescargar = async (documento) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');

      const response = await axios.get(`${API_URL}/documentos/${documento.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', documento.nombre);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('Documento descargado', 'success');
    } catch (error) {
      showToast('Error al descargar documento', 'error');
    }
  };

  const handleEliminar = (documento) => {
    setConfirmModal({
      title: 'Eliminar Documento',
      message: `¿Eliminar el documento "${documento.nombre}"? El archivo se eliminará permanentemente.`,
      type: 'danger',
      confirmText: 'Sí, Eliminar',
      onConfirm: async () => {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const token = localStorage.getItem('empleado_token');

          await axios.delete(`${API_URL}/documentos/${documento.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          showToast('Documento eliminado', 'success');
          onReload();
        } catch (error) {
          showToast('Error al eliminar documento', 'error');
        }
      }
    });
  };

  return (
    <div className="tab-panel">
      <div className="section-header">
        <h2>Documentos del Proyecto</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowDocumentoModal(true)}>
            📤 Subir Documento
          </button>
        )}
      </div>

      {documentos.length === 0 ? (
        <p className="empty-message">No hay documentos para este proyecto</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Tamaño</th>
                <th>Visibilidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((documento) => (
                <tr key={documento.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>
                        {getIconoTipo(documento.tipo_documento)}
                      </span>
                      <div>
                        <strong>{documento.nombre}</strong>
                        {documento.descripcion && (
                          <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                            {documento.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-tipo">
                      {documento.tipo_documento}
                    </span>
                  </td>
                  <td>{formatearFecha(documento.created_at)}</td>
                  <td>{formatearTamano(documento.tamano_bytes)}</td>
                  <td>
                    <span className={`badge ${documento.es_publico ? 'badge-publico' : 'badge-privado'}`}>
                      {documento.es_publico ? '🌐 Público' : '🔒 Privado'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-download"
                        onClick={() => handleDescargar(documento)}
                        title="Descargar"
                      >
                        ⬇️
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleEliminar(documento)}
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

      {showDocumentoModal && (
        <DocumentoModal
          proyectoId={proyectoId}
          onClose={() => setShowDocumentoModal(false)}
          onSuccess={() => {
            showToast('Documento subido exitosamente', 'success');
            setShowDocumentoModal(false);
            onReload();
          }}
          onError={(error) => showToast(error, 'error')}
        />
      )}
    </div>
  );
}

export default ProyectoDocumentos;