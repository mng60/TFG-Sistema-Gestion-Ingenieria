import React, { useState } from 'react';
import documentoService from '../../services/documentoService';

const ICONOS = {
  esquema: '📐', plano: '📏', contrato: '📜', informe: '📊',
  foto: '📸', certificado: '🏆', otro: '📄'
};

const fmtTamano = (bytes) => {
  if (!bytes) return '-';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-ES') : '-';

function DocumentosList({ documentos, isAdmin, onReload, showToast }) {
  const [toggling, setToggling] = useState({});

  const handleDescargar = async (doc) => {
    try {
      await documentoService.descargar(doc);
      showToast('Descargando...', 'success');
    } catch {
      showToast('Error al descargar', 'error');
    }
  };

  const handleTogglePublico = async (doc) => {
    if (toggling[doc.id]) return;
    setToggling((t) => ({ ...t, [doc.id]: true }));
    try {
      await documentoService.togglePublico(doc.id, !doc.es_publico);
      showToast(
        !doc.es_publico ? 'Documento visible para el cliente' : 'Documento ocultado al cliente',
        'success'
      );
      onReload();
    } catch {
      showToast('Error al cambiar visibilidad', 'error');
    } finally {
      setToggling((t) => ({ ...t, [doc.id]: false }));
    }
  };

  if (documentos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📄</span>
        <p>No hay documentos en este proyecto</p>
      </div>
    );
  }

  return (
    <div>
      {documentos.map((doc) => (
        <div key={doc.id} className="doc-card">
          <span className="doc-icon">{ICONOS[doc.tipo_documento] || '📄'}</span>
          <div className="doc-info">
            <div className="doc-nombre">{doc.nombre}</div>
            <div className="doc-meta">
              <span className="badge badge-tipo">{doc.tipo_documento}</span>
              <span>{fmtFecha(doc.created_at)}</span>
              <span>{fmtTamano(doc.tamano_bytes)}</span>
            </div>
            {isAdmin && (
              <div style={{ marginTop: 6 }}>
                <button
                  className={`toggle-publico ${doc.es_publico ? 'publico' : 'privado'}`}
                  onClick={() => handleTogglePublico(doc)}
                  disabled={toggling[doc.id]}
                >
                  {toggling[doc.id]
                    ? '...'
                    : doc.es_publico
                    ? '🌐 Visible al cliente'
                    : '🔒 Oculto al cliente'}
                </button>
              </div>
            )}
          </div>
          <div className="doc-actions">
            <button className="btn-icon" onClick={() => handleDescargar(doc)} title="Descargar">
              ⬇️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DocumentosList;
