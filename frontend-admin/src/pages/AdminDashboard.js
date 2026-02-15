import React, { useState, useEffect } from 'react';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import { useNavigate } from 'react-router-dom';
import proyectoService from '../services/proyectoService';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const { empleado, logout } = useEmpleadoAuth();
  const navigate = useNavigate();
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Panel Interno - Dashboard';
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const data = await proyectoService.getEstadisticas();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>SGI</h2>
          <p>Sistema de Gestión</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            className="nav-item active"
            onClick={() => navigate('/dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/clientes')}
          >
            👥 Clientes
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/proyectos')}
          >
            📁 Proyectos
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/presupuestos')}
          >
            💰 Presupuestos
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/documentos')}
          >
            📄 Documentos
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <p className="user-name">{empleado?.nombre}</p>
            <p className="user-role">{empleado?.rol}</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>Dashboard</h1>
          <p>Visión general del sistema</p>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-info">
              <p className="stat-label">Total Proyectos</p>
              <p className="stat-value">{estadisticas?.total_proyectos || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <p className="stat-label">En Progreso</p>
              <p className="stat-value">{estadisticas?.por_estado?.en_progreso || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <p className="stat-label">Completados</p>
              <p className="stat-value">{estadisticas?.por_estado?.completado || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏸️</div>
            <div className="stat-info">
              <p className="stat-label">Pendientes</p>
              <p className="stat-value">{estadisticas?.por_estado?.pendiente || 0}</p>
            </div>
          </div>

          <div className="stat-card stat-card-wide">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <p className="stat-label">Presupuesto Total Estimado</p>
              <p className="stat-value">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(estadisticas?.presupuesto_total_estimado || 0)}
              </p>
            </div>
          </div>

          <div className="stat-card stat-card-wide">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <p className="stat-label">Presupuesto Real Total</p>
              <p className="stat-value">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(estadisticas?.presupuesto_real_total || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Acciones Rápidas</h2>
          <div className="actions-grid">
            <button 
              className="action-btn"
              onClick={() => navigate('/clientes/nuevo')}
            >
              <span className="action-icon">➕</span>
              <span>Nuevo Cliente</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/proyectos/nuevo')}
            >
              <span className="action-icon">📁</span>
              <span>Nuevo Proyecto</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/presupuestos/nuevo')}
            >
              <span className="action-icon">💰</span>
              <span>Nuevo Presupuesto</span>
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/documentos/subir')}
            >
              <span className="action-icon">📤</span>
              <span>Subir Documento</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;