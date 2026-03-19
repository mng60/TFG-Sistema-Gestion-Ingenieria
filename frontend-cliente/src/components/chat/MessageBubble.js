import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import ImageViewer from './ImageViewer';

function MessageBubble({ mensaje, isOwn, conversacion }) {
  const [showImageViewer, setShowImageViewer] = useState(false);

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${API_BASE}${url}`;
  };

  const parseChatDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const str = String(value);
    if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(str)) return new Date(str);
    return new Date(`${str}Z`);
  };

  const formatearHora = (fecha) => {
    const d = parseChatDate(fecha);
    if (!d || Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getCheckmarks = () => {
    if (!isOwn) return null;
    if (!conversacion?.participantes || conversacion.participantes.length === 0) {
      return <span className="message-status">✓✓</span>;
    }
    const otrosParticipantes = conversacion.participantes.filter(
      p => !(p.user_id === mensaje.user_id && p.tipo_usuario === mensaje.tipo_usuario)
    );
    if (otrosParticipantes.length === 0) return <span className="message-status">✓✓</span>;

    const todosLeyeron = otrosParticipantes.every((p) => {
      const readDate = parseChatDate(p.last_read);
      const messageDate = parseChatDate(mensaje.created_at);
      if (!readDate || !messageDate) return false;
      if (Number.isNaN(readDate.getTime()) || Number.isNaN(messageDate.getTime())) return false;
      return readDate.getTime() >= messageDate.getTime();
    });

    return <span className={`message-status ${todosLeyeron ? 'read' : ''}`}>✓✓</span>;
  };

  const renderContent = () => {
    switch (mensaje.tipo_mensaje) {
      case 'texto':
        return <p className="message-text">{mensaje.mensaje}</p>;

      case 'archivo':
        return (
          <div
            className="message-file"
            onClick={async (e) => {
              e.stopPropagation();
              const url = getFullUrl(mensaje.archivo_url);
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(url, {
                  headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = mensaje.archivo_nombre || 'archivo';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
              } catch (err) {
                console.error('Error al descargar archivo:', err);
                alert('Error al descargar el archivo');
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="file-icon">
              <FileText size={18} />
            </div>
            <div className="file-info">
              <span className="file-name">{mensaje.archivo_nombre}</span>
            </div>
          </div>
        );

      case 'imagen':
        return (
          <>
            <div className="message-image" onClick={(e) => { e.stopPropagation(); setShowImageViewer(true); }}>
              <img
                src={getFullUrl(mensaje.archivo_url)}
                alt={mensaje.archivo_nombre}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            {showImageViewer && (
              <ImageViewer
                imageUrl={getFullUrl(mensaje.archivo_url)}
                imageName={mensaje.archivo_nombre}
                onClose={() => setShowImageViewer(false)}
              />
            )}
          </>
        );

      case 'audio':
        return (
          <div className="message-audio">
            <audio controls src={getFullUrl(mensaje.archivo_url)}>
              Tu navegador no soporta audio.
            </audio>
          </div>
        );

      default:
        return <p className="message-text">{mensaje.mensaje}</p>;
    }
  };

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && (
        <div className="message-sender">{mensaje.remitente_nombre}</div>
      )}
      <div className="message-content">
        {renderContent()}
        <div className="message-meta">
          <span className="message-time">{formatearHora(mensaje.created_at)}</span>
          {isOwn && getCheckmarks()}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
