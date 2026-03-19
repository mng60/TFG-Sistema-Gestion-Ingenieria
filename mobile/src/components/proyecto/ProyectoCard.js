import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, MapPin } from 'lucide-react';
import '../../styles/Proyectos.css';
import { formatearFechaCorta } from '../../utils/format';

const ESTADO_LABELS = {
  planificacion: 'Planificación',
  en_progreso: 'En progreso',
  pausado: 'Pausado',
  completado: 'Completado',
  cancelado: 'Cancelado'
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
            {ESTADO_LABELS[proyecto.estado] || proyecto.estado?.replace('_', ' ')}
          </span>
          <span className={`badge badge-${proyecto.prioridad}`}>
            {proyecto.prioridad}
          </span>
        </div>
      </div>
      <div className="proyecto-card-meta">
        {proyecto.nombre_cliente && (
          <span><Users size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{proyecto.nombre_cliente}</span>
        )}
        {proyecto.fecha_fin && (
          <span><Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />Fin: {formatearFechaCorta(proyecto.fecha_fin)}</span>
        )}
        {proyecto.ubicacion && (
          <span><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />{proyecto.ubicacion}</span>
        )}
      </div>
    </div>
  );
}

export default ProyectoCard;
