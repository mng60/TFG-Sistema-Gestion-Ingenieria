import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Flag } from 'lucide-react';
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
        <h1>Mis Proyectos</h1>
        <span className="count-badge">{proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''}</span>
      </div>

      {proyectos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h3>No tienes proyectos asignados</h3>
          <p>Cuando se te asigne un proyecto aparecera aqui.</p>
        </div>
      ) : (
        <div className="proyectos-grid">
          {proyectos.map((proyecto) => (
            <Link key={proyecto.id} to={`/proyectos/${proyecto.id}`} className="proyecto-card">
              <div className="proyecto-card-header">
                <h3>{proyecto.nombre}</h3>
              </div>

              <div className="proyecto-card-body">
                {proyecto.descripcion && <p className="proyecto-desc">{proyecto.descripcion}</p>}

                <div className="proyecto-meta">
                  {proyecto.ubicacion && (
                    <span><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />{proyecto.ubicacion}</span>
                  )}
                  <span><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />Inicio: {formatearFecha(proyecto.fecha_inicio)}</span>
                  {proyecto.fecha_fin_estimada && (
                    <span><Flag size={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />Fin est.: {formatearFecha(proyecto.fecha_fin_estimada)}</span>
                  )}
                </div>
              </div>

              <div className="proyecto-card-footer">
                <span className="ver-detalle">Ver detalles →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
