import React, { useState, useEffect } from 'react';

function ArchivosPanel({ conversacionId, onClose }) {
  const [archivos, setArchivos] = useState({ imagenes: [], documentos: [], audios: [] });
  const [loading, setLoading] = useState(true);
  const [tipoActivo, setTipoActivo] = useState('imagenes');

  useEffect(() => {
    cargarArchivos();
  }, [conversacionId]);

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${API_BASE}${url}`;
  };

  const cargarArchivos = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_URL}/chat/conversaciones/${conversacionId}/archivos`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) setArchivos(data.archivos);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  const getIconoArchivo = (archivoTipo) => {
    if (!archivoTipo) return '📄';
    if (archivoTipo.includes('pdf')) return '📕';
    if (archivoTipo.includes('word') || archivoTipo.includes('document')) return '📘';
    if (archivoTipo.includes('excel') || archivoTipo.includes('spreadsheet')) return '📗';
    if (archivoTipo.includes('powerpoint') || archivoTipo.includes('presentation')) return '📙';
    if (archivoTipo.includes('zip') || archivoTipo.includes('rar')) return '🗜️';
    return '📄';
  };

  const handleDescargar = (archivo) => {
    const url = getFullUrl(archivo.archivo_url);
    const link = document.createElement('a');
    link.href = url;
    link.download = archivo.archivo_nombre;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalArchivos = archivos.imagenes.length + archivos.documentos.length + archivos.audios.length;

  return (
    <div className="archivos-panel-overlay" onClick={onClose}>
      <div className="archivos-panel" onClick={(e) => e.stopPropagation()}>
        <div className="archivos-panel-header">
          <button className="btn-back" onClick={onClose}>← Volver</button>
          <h3>Archivos Compartidos ({totalArchivos})</h3>
          <button className="btn-close-panel" onClick={onClose}>✕</button>
        </div>

        <div className="archivos-tabs">
          <button
            className={`archivos-tab ${tipoActivo === 'imagenes' ? 'active' : ''}`}
            onClick={() => setTipoActivo('imagenes')}
          >
            📸 Fotos ({archivos.imagenes.length})
          </button>
          <button
            className={`archivos-tab ${tipoActivo === 'documentos' ? 'active' : ''}`}
            onClick={() => setTipoActivo('documentos')}
          >
            📂 Documentos ({archivos.documentos.length})
          </button>
          <button
            className={`archivos-tab ${tipoActivo === 'audios' ? 'active' : ''}`}
            onClick={() => setTipoActivo('audios')}
          >
            🎵 Audios ({archivos.audios.length})
          </button>
        </div>

        <div className="archivos-content">
          {loading ? (
            <div className="archivos-loading">
              <div className="spinner"></div>
              <p>Cargando archivos...</p>
            </div>
          ) : (
            <>
              {tipoActivo === 'imagenes' && (
                archivos.imagenes.length === 0 ? (
                  <div className="archivos-empty">
                    <span className="empty-icon">📸</span>
                    <p>No hay imágenes compartidas</p>
                  </div>
                ) : (
                  <div className="archivos-grid-imagenes">
                    {archivos.imagenes.map(archivo => (
                      <div
                        key={archivo.id}
                        className="archivo-imagen-item"
                        onClick={() => window.open(getFullUrl(archivo.archivo_url), '_blank')}
                      >
                        <img
                          src={getFullUrl(archivo.archivo_url)}
                          alt={archivo.archivo_nombre}
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect fill="%23ddd" width="120" height="120"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999"%3E❌%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div className="archivo-imagen-info">
                          <small>{formatearFecha(archivo.created_at)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tipoActivo === 'documentos' && (
                archivos.documentos.length === 0 ? (
                  <div className="archivos-empty">
                    <span className="empty-icon">📂</span>
                    <p>No hay documentos compartidos</p>
                  </div>
                ) : (
                  <div className="archivos-lista">
                    {archivos.documentos.map(archivo => (
                      <div key={archivo.id} className="archivo-documento-item">
                        <div className="archivo-icono">{getIconoArchivo(archivo.archivo_tipo)}</div>
                        <div className="archivo-info">
                          <strong>{archivo.archivo_nombre}</strong>
                          <small>{archivo.usuario_nombre} • {formatearFecha(archivo.created_at)}</small>
                        </div>
                        <button className="btn-descargar" onClick={() => handleDescargar(archivo)}>
                          ⬇️
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tipoActivo === 'audios' && (
                archivos.audios.length === 0 ? (
                  <div className="archivos-empty">
                    <span className="empty-icon">🎵</span>
                    <p>No hay audios compartidos</p>
                  </div>
                ) : (
                  <div className="archivos-lista">
                    {archivos.audios.map(archivo => (
                      <div key={archivo.id} className="archivo-audio-item">
                        <div className="archivo-icono">🎵</div>
                        <div className="archivo-info">
                          <strong>Audio de {archivo.usuario_nombre}</strong>
                          <small>{formatearFecha(archivo.created_at)}</small>
                        </div>
                        <audio controls src={getFullUrl(archivo.archivo_url)}>
                          Tu navegador no soporta audio.
                        </audio>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArchivosPanel;
