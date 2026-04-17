import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, FileText, Headphones, Images } from 'lucide-react';

function AttachmentMenu({ onSelect, onClose }) {
  const menuRef = useRef(null);
  const [view, setView] = useState('main');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const opcionesPrincipales = useMemo(() => ([
    {
      id: 'foto-imagen',
      label: 'Foto/Imagen',
      icon: <Camera size={30} color="#3498db" />
    },
    {
      id: 'documento',
      label: 'Archivo',
      icon: <FileText size={30} color="#f39c12" />,
      accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.csv,.ppt,.pptx',
      tipo_mensaje: 'archivo'
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: <Headphones size={30} color="#e74c3c" />,
      accept: 'audio/*',
      tipo_mensaje: 'audio'
    }
  ]), []);

  const opcionesImagen = useMemo(() => ([
    {
      id: 'camara',
      label: 'Hacer foto',
      icon: <Camera size={30} color="#3498db" />,
      accept: 'image/*',
      capture: 'environment',
      tipo_mensaje: 'imagen'
    },
    {
      id: 'galeria',
      label: 'Elegir imagen',
      icon: <Images size={30} color="#4DB6A8" />,
      accept: 'image/*',
      tipo_mensaje: 'imagen'
    }
  ]), []);

  const handleOptionClick = (opcion) => {
    if (opcion.id === 'foto-imagen') {
      setView('image');
      return;
    }

    onSelect(opcion);
  };

  const opcionesActivas = view === 'main' ? opcionesPrincipales : opcionesImagen;

  return (
    <div className="attachment-menu" ref={menuRef}>
      {view === 'image' && (
        <button
          type="button"
          className="attachment-menu-back"
          onClick={() => setView('main')}
        >
          <ArrowLeft size={16} />
          <span>Foto/Imagen</span>
        </button>
      )}

      {opcionesActivas.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          className="attachment-option"
          onClick={() => handleOptionClick(opcion)}
        >
          <span className="attachment-icon">{opcion.icon}</span>
          <span className="attachment-label">{opcion.label}</span>
        </button>
      ))}
    </div>
  );
}

export default AttachmentMenu;
