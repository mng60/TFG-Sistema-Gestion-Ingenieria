import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import proyectoService from '../services/proyectoService';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
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
            <p className="stat-label">Facturado (Aceptado)</p>
            <p className="stat-value">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
              }).format(estadisticas?.presupuesto_real_total || 0)}
            </p>
            <small style={{ color: '#7f8c8d' }}>
              Sin IVA: {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
              }).format(estadisticas?.presupuesto_total_estimado || 0)}
            </small>
          </div>
        </div>
      </div>

      <div className="welcome-section">
        <div className="welcome-card">
          <div className="welcome-icon">⚡</div>
          <h2>Bienvenido al Sistema de Gestión</h2>
          <p>Gestiona proyectos, clientes, presupuestos y documentos de forma eficiente</p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;