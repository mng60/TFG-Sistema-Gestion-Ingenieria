import React, { useState, useEffect } from 'react';
import MobileLayout from '../components/layout/MobileLayout';
import ProyectoCard from '../components/proyecto/ProyectoCard';
import proyectoService from '../services/proyectoService';
import '../styles/Proyectos.css';

const ESTADOS = ['todos', 'pendiente', 'en_progreso', 'completado', 'cancelado'];

function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const data = await proyectoService.getAll();
      setProyectos(data.proyectos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const proyectosFiltrados = proyectos.filter((p) => {
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const matchBusqueda =
      !busqueda ||
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  return (
    <MobileLayout>
      <div className="proyectos-page">
        <div className="proyectos-search">
          <input
            className="search-input"
            type="text"
            placeholder="🔍 Buscar proyectos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="filter-chips">
            {ESTADOS.map((e) => (
              <button
                key={e}
                className={`filter-chip ${filtroEstado === e ? 'active' : ''}`}
                onClick={() => setFiltroEstado(e)}
              >
                {e === 'todos' ? 'Todos' : e.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
            <span>Cargando proyectos...</span>
          </div>
        ) : proyectosFiltrados.length === 0 ? (
          <div className="proyectos-empty">
            <span className="empty-icon">📁</span>
            <p>No se encontraron proyectos</p>
          </div>
        ) : (
          <div className="proyectos-list">
            {proyectosFiltrados.map((p) => (
              <ProyectoCard key={p.id} proyecto={p} />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default Proyectos;
