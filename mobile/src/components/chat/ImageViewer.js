import React, { useState } from 'react';
import { Download, X, Check } from 'lucide-react';
import { downloadUrlToDevice, getDownloadLocationLabel } from '../../utils/nativeDownloads';

function ImageViewer({ imageUrl, imageName, downloadUrl, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [savedLabel, setSavedLabel] = useState(null);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    setSavedLabel(null);
    try {
      const result = await downloadUrlToDevice({
        url: downloadUrl || imageUrl,
        fileName: imageName || 'imagen',
        category: 'image'
      });
      const label = getDownloadLocationLabel(result?.category || 'image');
      setSavedLabel(label);
      setTimeout(() => setSavedLabel(null), 3000);
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
            disabled={downloading || !!savedLabel}
          >
            {downloading
              ? '⏳'
              : savedLabel
                ? <><Check size={16} style={{ verticalAlign: 'middle' }} /> {savedLabel}</>
                : <Download size={20} />}
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
