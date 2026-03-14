import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import MobileLayout from '../components/layout/MobileLayout';
import ProyectoCard from '../components/proyecto/ProyectoCard';
import proyectoService from '../services/proyectoService';
import '../styles/Proyectos.css';
import {FolderOpen} from 'lucide-react';

const ESTADOS = ['todos', 'planificacion', 'en_progreso', 'pausado', 'completado', 'cancelado'];

const ESTADO_LABELS = {
  todos: 'Todos',
  planificacion: 'Planificación',
  en_progreso: 'En progreso',
  pausado: 'Pausado',
  completado: 'Completado',
  cancelado: 'Cancelado'
};

function Proyectos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const params = new URLSearchParams(location.search);
  const clienteIdFiltro = params.get('cliente_id');
  const empleadoIdFiltro = params.get('empleado_id');
  const soloEmpleadoIdFiltro = params.get('solo_empleado_id');
  const nombreFiltro = params.get('nombre') ? decodeURIComponent(params.get('nombre')) : null;

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await proyectoService.getAll();
        setProyectos(data.proyectos || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const proyectosFiltrados = proyectos.filter((p) => {
    if (clienteIdFiltro && String(p.cliente_id) !== String(clienteIdFiltro)) return false;

    const empleadosIds = (p.empleados_ids || []).map(String);
    if (soloEmpleadoIdFiltro && !empleadosIds.includes(String(soloEmpleadoIdFiltro))) return false;
    if (empleadoIdFiltro && !empleadosIds.includes(String(empleadoIdFiltro))) return false;

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
        {nombreFiltro && (
          <div className="filter-banner">
            <span>Filtrando por: <strong>{nombreFiltro}</strong></span>
            <button className="filter-banner-close" onClick={() => navigate('/proyectos')}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="proyectos-search">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Buscar proyectos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="filter-chips">
            {ESTADOS.map((e) => (
              <button
                key={e}
                className={`filter-chip ${filtroEstado === e ? 'active' : ''}`}
                onClick={() => setFiltroEstado(e)}
              >
                {ESTADO_LABELS[e]}
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
            <span className="empty-icon"><FolderOpen size={40} color="#bdc3c7" /></span>
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
