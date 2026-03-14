import React from 'react';
import { MapPin } from 'lucide-react';

const fmt = (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-';

function ProyectoInfo({ proyecto }) {
  return (
    <div>
      <section className="info-section">
        <h3>Información General</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Cliente</label>
            <span>{proyecto.cliente_nombre || proyecto.nombre_cliente || '-'}</span>
          </div>
          <div className="info-item">
            <label>Responsable</label>
            <span>{proyecto.responsable_nombre || 'Sin asignar'}</span>
          </div>
          <div className="info-item">
            <label>Inicio</label>
            <span>{fmt(proyecto.fecha_inicio)}</span>
          </div>
          <div className="info-item">
            <label>Fin estimado</label>
            <span>{fmt(proyecto.fecha_fin_estimada || proyecto.fecha_fin)}</span>
          </div>
          {proyecto.fecha_fin_real && (
            <div className="info-item">
              <label>Fin real</label>
              <span>{fmt(proyecto.fecha_fin_real)}</span>
            </div>
          )}
          {proyecto.ubicacion && (
            <div className="info-item full">
              <label>Ubicación</label>
              <span><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{proyecto.ubicacion}</span>
            </div>
          )}
        </div>
      </section>

      {proyecto.descripcion && (
        <section className="info-section">
          <h3>Descripción</h3>
          <p className="info-text">{proyecto.descripcion}</p>
        </section>
      )}

      {proyecto.notas && (
        <section className="info-section">
          <h3>Notas</h3>
          <p className="info-text">{proyecto.notas}</p>
        </section>
      )}
    </div>
  );
}

export default ProyectoInfo;
