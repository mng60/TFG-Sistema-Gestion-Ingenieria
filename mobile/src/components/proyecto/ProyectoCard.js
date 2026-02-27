import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Proyectos.css';

const formatFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

function ProyectoCard({ proyecto }) {
  const navigate = useNavigate();

  return (
    <div
      className={`proyecto-card estado-${proyecto.estado}`}
      onClick={() => navigate(`/proyectos/${proyecto.id}`)}
    >
      <div className="proyecto-card-header">
        <span className="proyecto-card-nombre">{proyecto.nombre}</span>
        <div className="proyecto-card-badges">
          <span className={`badge badge-${proyecto.estado}`}>
            {proyecto.estado?.replace('_', ' ')}
          </span>
          <span className={`badge badge-${proyecto.prioridad}`}>
            {proyecto.prioridad}
          </span>
        </div>
      </div>
      <div className="proyecto-card-meta">
        {proyecto.nombre_cliente && (
          <span>👥 {proyecto.nombre_cliente}</span>
        )}
        {proyecto.fecha_fin && (
          <span>📅 Fin: {formatFecha(proyecto.fecha_fin)}</span>
        )}
        {proyecto.ubicacion && (
          <span>📍 {proyecto.ubicacion}</span>
        )}
      </div>
    </div>
  );
}

export default ProyectoCard;
