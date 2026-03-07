import React, { useEffect, useRef } from 'react';
import { Camera, FileText, Headphones } from 'lucide-react';

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

  const opciones = [
    { id: 'foto', label: 'Foto/Imagen', icon: <Camera size={35} color="blue"/>, accept: 'image/*', tipo_mensaje: 'imagen' },
    { id: 'documento', label: 'Documento', icon: <FileText size={35} color="orange"/>, accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar', tipo_mensaje: 'archivo' },
    { id: 'audio', label: 'Audio', icon: <Headphones size={35} color="red"/>, accept: 'audio/*', tipo_mensaje: 'audio' }
  ];

  return (
    <div className="attachment-menu" ref={menuRef}>
      {opciones.map(opcion => (
        <button key={opcion.id} className="attachment-option" onClick={() => onSelect(opcion)}>
          <span className="attachment-icon">{opcion.icon}</span>
          <span className="attachment-label">{opcion.label}</span>
        </button>
      ))}
    </div>
  );
}

export default AttachmentMenu;
