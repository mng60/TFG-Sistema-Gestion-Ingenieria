import React, { useState } from 'react';

function ImageViewer({ imageUrl, imageName, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const token = localStorage.getItem('empleado_token');
      const res = await fetch(imageUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = imageName || 'imagen';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error al descargar imagen:', err);
      alert('Error al descargar la imagen');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-container">
        {/* Header con botón descargar */}
        <div className="image-viewer-header">
          <button
            className="btn-download-image"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? '⏳ Descargando...' : '⬇️ Descargar'}
          </button>
          <button className="btn-close-viewer" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Imagen centrada */}
        <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
          <img 
            src={imageUrl} 
            alt={imageName}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Nombre del archivo */}
        <div className="image-viewer-footer">
          <span>{imageName}</span>
        </div>
      </div>
    </div>
  );
}

export default ImageViewer;