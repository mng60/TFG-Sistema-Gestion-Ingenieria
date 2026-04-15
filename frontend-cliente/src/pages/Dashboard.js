import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import api from '../services/api';
import { formatearFecha } from '../utils/format';
import '../styles/Dashboard.css';

function Dashboard() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Mis Proyectos - Portal Cliente';
    api.get('/portal/proyectos')
      .then((res) => setProyectos(res.data.proyectos || []))
      .catch((err) => console.error('Error al cargar proyectos:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Mis Proyectos</h1>
          <p className="page-subheader">Gestiona y visualiza todos tus proyectos</p>
        </div>
        <span className="count-badge">{proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''}</span>
      </div>

      {proyectos.length === 0 ? (
        <div className="empty-state">
          <h3>No tienes proyectos asignados</h3>
          <p>Cuando se te asigne un proyecto aparecera aqui.</p>
        </div>
      ) : (
        <div className="proyectos-list">
          {proyectos.map((proyecto) => (
            <Link key={proyecto.id} to={`/proyectos/${proyecto.id}`} className="proyecto-card">
              <div className="proyecto-card-body">
                <h3 className="proyecto-title">{proyecto.nombre}</h3>
                {proyecto.descripcion && (
                  <p className="proyecto-desc">{proyecto.descripcion}</p>
                )}
                <div className="proyecto-meta">
                  {proyecto.ubicacion && (
                    <span>
                      <MapPin size={14} />
                      {proyecto.ubicacion}
                    </span>
                  )}
                  <span>
                    <Calendar size={14} />
                    {formatearFecha(proyecto.fecha_inicio)}
                    {proyecto.fecha_fin_estimada && ` — ${formatearFecha(proyecto.fecha_fin_estimada)}`}
                  </span>
                </div>
              </div>
              <span className="ver-detalle">Ver detalles →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
