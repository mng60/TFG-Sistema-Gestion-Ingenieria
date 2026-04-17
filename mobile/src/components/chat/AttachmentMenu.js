import React, { useEffect, useMemo, useRef } from 'react';
import { Camera, FileText, Headphones, Images } from 'lucide-react';

function AttachmentMenu({ onSelect, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const opciones = useMemo(() => ([
    {
      id: 'camara',
      label: 'Cámara',
      icon: <Camera size={30} color="#3498db" />
      ,
      accept: 'image/*',
      capture: 'environment',
      tipo_mensaje: 'imagen'
    },
    {
      id: 'galeria',
      label: 'Foto/Imagen',
      icon: <Images size={30} color="#4DB6A8" />,
      accept: 'image/*',
      tipo_mensaje: 'imagen'
    },
    {
      id: 'documento',
      label: 'Archivo',
      icon: <FileText size={30} color="#f39c12" />,
      accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.csv,.ppt,.pptx',
      tipo_mensaje: 'archivo'
    },
    {
      id: 'audio-dispositivo',
      label: 'Audio',
      icon: <Headphones size={30} color="#e74c3c" />,
      accept: 'audio/*',
      tipo_mensaje: 'audio'
    }
  ]), []);

  return (
    <div className="attachment-menu" ref={menuRef}>
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          className="attachment-option"
          onClick={() => onSelect(opcion)}
        >
          <span className="attachment-icon">{opcion.icon}</span>
          <span className="attachment-label">{opcion.label}</span>
        </button>
      ))}
    </div>
  );
}

export default AttachmentMenu;
