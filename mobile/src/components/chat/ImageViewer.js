import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { downloadUrlToDevice } from '../../utils/nativeDownloads';

function ImageViewer({ imageUrl, imageName, downloadUrl, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadUrlToDevice({
        url: downloadUrl || imageUrl,
        fileName: imageName || 'imagen',
        category: 'image'
      });
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
            {downloading ? '⏳ Descargando...' : <Download size={20} />}
          </button>
          <button className="btn-close-viewer" onClick={onClose}>
            <X size={29}/>
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
