import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import proyectoService from '../services/proyectoService';
import {
  FolderOpen,
  Zap,
  CheckCircle2,
  TicketCheck,
  Clock,
  ChevronRight,
  TrendingUp,
  MessagesSquare,
  FileText,
  Euro
} from 'lucide-react';
import '../styles/AdminDashboard.css';

const ESTADO_CONFIG = {
  en_progreso: { label: 'En Progreso', color: '#4DB6A8' },
  completado: { label: 'Completado', color: '#27ae60' },
  pendiente: { label: 'Pendiente', color: '#e67e22' },
  pausado: { label: 'Pausado', color: '#95a5a6' },
  cancelado: { label: 'Cancelado', color: '#e74c3c' }
};

const PRIORIDAD_CONFIG = {
  urgente: { label: 'Urgente', color: '#e74c3c' },
  alta: { label: 'Alta', color: '#e67e22' },
  media: { label: 'Media', color: '#f39c12' },
  baja: { label: 'Baja', color: '#95a5a6' }
};

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value || 0);
}

function formatShortDate(dateStr) {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).format(new Date(dateStr));
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function getTicketTypeLabel(tipo) {
  if (tipo === 'contacto_web') return 'Web';
  if (tipo === 'solicitud_nuevo_proyecto') return 'Proyecto';
  if (tipo === 'solicitud_presupuesto') return 'Presupuesto';
  if (tipo === 'olvido_password') return 'Acceso';
  return 'Ticket';
}

function AdminDashboard() {
  const { empleado, isAdmin } = useEmpleadoAuth();
  const navigate = useNavigate();
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Panel Interno - Dashboard';
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const data = await proyectoService.getDashboard();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error al cargar estadisticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  const e = estadisticas || {};
  const admin = isAdmin();
  const proyectosRecientes = (e.proyectos_recientes || []).slice(0, 5);
  const ultimosPresupuestos = (e.ultimos_presupuestos || []).slice(0, 5);
  const ultimosTickets = (e.ultimos_tickets || []).slice(0, 5);

  const kpis = admin
    ? [
        { icon: <FolderOpen size={20} />, label: 'Proyectos', value: e.total_proyectos || 0, color: '#4DB6A8', onClick: () => navigate('/proyectos') },
        { icon: <Zap size={20} />, label: 'En progreso', value: e.por_estado?.en_progreso || 0, color: '#3498db', onClick: () => navigate('/proyectos') },
        { icon: <CheckCircle2 size={20} />, label: 'Completados', value: e.por_estado?.completado || 0, color: '#27ae60', onClick: () => navigate('/proyectos') },
        { icon: <TicketCheck size={20} />, label: 'Tickets pendientes', value: e.tickets_pendientes || 0, color: '#e67e22', onClick: () => navigate('/tickets') },
        { icon: <Euro size={20} />, label: 'Facturación total (proyectos aceptados)', value: formatCurrency(e.presupuesto_real_total), color: '#8e44ad', wide: true }
      ]
    : [
        { icon: <FolderOpen size={22} />, label: 'Mis Proyectos', value: e.total_proyectos || 0, color: '#4DB6A8', onClick: () => navigate('/proyectos') },
        { icon: <Zap size={22} />, label: 'En Progreso', value: e.por_estado?.en_progreso || 0, color: '#3498db', onClick: () => navigate('/proyectos') },
        { icon: <CheckCircle2 size={22} />, label: 'Completados', value: e.por_estado?.completado || 0, color: '#27ae60', onClick: () => navigate('/proyectos') },
        { icon: <MessagesSquare size={22} />, label: 'Mensajes sin leer', value: e.mensajes_no_leidos || 0, color: '#e67e22', onClick: () => navigate('/chat') }
      ];

  const renderRecentProjects = () => {
    if (proyectosRecientes.length === 0) {
      return <p className="dash-empty">No hay actividad reciente en proyectos.</p>;
    }

    return (
      <div className="dash-recientes">
        {proyectosRecientes.map((proyecto) => {
          const estado = ESTADO_CONFIG[proyecto.estado] || { label: proyecto.estado, color: '#95a5a6' };
          const prioridad = PRIORIDAD_CONFIG[proyecto.prioridad];

          return (
            <div
              key={proyecto.id}
              className="dash-rec-item"
              onClick={() => navigate(`/proyectos/${proyecto.id}`)}
            >
              <div className="dash-rec-main">
                <span className="dash-rec-nombre">{proyecto.nombre}</span>
                <span className="dash-rec-cliente">{proyecto.cliente_nombre || 'Sin cliente asignado'}</span>
              </div>
              <div className="dash-rec-meta">
                {prioridad && (
                  <span
                    className="dash-rec-badge"
                    style={{
                      background: `${prioridad.color}22`,
                      color: prioridad.color,
                      border: `1px solid ${prioridad.color}44`
                    }}
                  >
                    {prioridad.label}
                  </span>
                )}
                <span
                  className="dash-rec-badge"
                  style={{
                    background: `${estado.color}22`,
                    color: estado.color,
                    border: `1px solid ${estado.color}44`
                  }}
                >
                  {estado.label}
                </span>
                <span className="dash-rec-time">
                  <Clock size={12} /> {timeAgo(proyecto.ultima_actividad)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Separar KPI de facturación del resto (para renderizarlo como card grande)
  const kpisRegulares = kpis.filter((k) => !k.wide);
  const kpiFacturacion = kpis.find((k) => k.wide);

  return (
    <>
      {/* Header */}
      <div className="dash-header">
        <div>
          <p className="dash-greeting">Bienvenido de nuevo</p>
          <h1 className="dash-title">{empleado?.nombre || 'Dashboard'}</h1>
        </div>
        <span className={`dash-role-badge ${admin ? 'dash-role-badge--admin' : ''}`}>
          {admin ? 'Administrador' : 'Empleado'}
        </span>
      </div>

      {/* KPI cards regulares */}
      <div className="dash-kpis">
        {kpisRegulares.map((kpi, index) => (
          <div
            key={index}
            className={`dash-kpi${kpi.onClick ? ' dash-kpi--clickable' : ''}`}
            onClick={kpi.onClick}
            style={{ '--kpi-color': kpi.color }}
          >
            <div className="dash-kpi-icon">{kpi.icon}</div>
            <div className="dash-kpi-info">
              <p className="dash-kpi-label">{kpi.label}</p>
              <p className="dash-kpi-value">{kpi.value}</p>
            </div>
            {kpi.onClick && <ChevronRight size={16} className="dash-kpi-arrow" />}
          </div>
        ))}
      </div>

      {/* Card grande de facturación (solo admin) */}
      {kpiFacturacion && (
        <div className="dash-facturacion" style={{ '--kpi-color': kpiFacturacion.color }}>
          <div className="dash-facturacion-info">
            <p className="dash-facturacion-label">{kpiFacturacion.label}</p>
            <p className="dash-facturacion-value">{kpiFacturacion.value}</p>
          </div>
          <div className="dash-facturacion-icon">
            {kpiFacturacion.icon}
          </div>
        </div>
      )}

      {admin ? (
        <div className="dash-overview-grid">
          <section className="dash-section dash-section--activity">
            <div className="dash-section-header">
              <span className="dash-section-title">
                <TrendingUp size={16} /> Actividad reciente
              </span>
              <button className="dash-section-link" onClick={() => navigate('/proyectos')}>
                Ver proyectos →
              </button>
            </div>
            {renderRecentProjects()}
          </section>

          <div className="dash-side-stack">
            <section className="dash-section dash-section--compact">
              <div className="dash-section-header">
                <span className="dash-section-title">
                  <FileText size={16} /> Últimos presupuestos
                </span>
                <button className="dash-section-link" onClick={() => navigate('/proyectos')}>
                  Ver todos →
                </button>
              </div>

              {ultimosPresupuestos.length > 0 ? (
                <div className="dash-mini-table-wrap">
                  <table className="dash-mini-table">
                    <tbody>
                      {ultimosPresupuestos.map((presupuesto) => (
                        <tr
                          key={presupuesto.id}
                          className="dash-mini-row"
                          onClick={() => presupuesto.proyecto_id && navigate(`/proyectos/${presupuesto.proyecto_id}`)}
                        >
                          <td>
                            <strong>{presupuesto.numero_presupuesto}</strong>
                            <span>{presupuesto.proyecto_nombre || 'Proyecto sin nombre'}</span>
                          </td>
                          <td>
                            <strong>{formatCurrency(presupuesto.total)}</strong>
                            <span>{formatShortDate(presupuesto.fecha_referencia)}</span>
                          </td>
                          <td>
                            <span className={`dash-status-pill dash-status-pill--${presupuesto.estado || 'borrador'}`}>
                              {presupuesto.estado || 'borrador'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="dash-empty dash-empty--compact">No hay presupuestos recientes.</p>
              )}
            </section>

            <section className="dash-section dash-section--compact">
              <div className="dash-section-header">
                <span className="dash-section-title">
                  <TicketCheck size={16} /> Últimos tickets
                </span>
                <button className="dash-section-link" onClick={() => navigate('/tickets')}>
                  Ver tickets →
                </button>
              </div>

              {ultimosTickets.length > 0 ? (
                <div className="dash-mini-table-wrap">
                  <table className="dash-mini-table">
                    <tbody>
                      {ultimosTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="dash-mini-row"
                          onClick={() => navigate('/tickets')}
                        >
                          <td>
                            <strong>{getTicketTypeLabel(ticket.tipo)}</strong>
                            <span>{ticket.nombre || ticket.email}</span>
                          </td>
                          <td>
                            <strong>{ticket.estado}</strong>
                            <span>{formatShortDate(ticket.created_at)}</span>
                          </td>
                          <td>
                            <span className={`dash-status-pill dash-status-pill--${ticket.estado || 'pendiente'}`}>
                              {ticket.estado || 'pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="dash-empty dash-empty--compact">No hay tickets recientes.</p>
              )}
            </section>
          </div>
        </div>
      ) : (
        <section className="dash-section">
          <div className="dash-section-header">
            <span className="dash-section-title">
              <TrendingUp size={16} /> Actividad reciente
            </span>
            <button className="dash-section-link" onClick={() => navigate('/proyectos')}>
              Ver proyectos →
            </button>
          </div>
          {renderRecentProjects()}
        </section>
      )}
    </>
  );
}

export default AdminDashboard;
