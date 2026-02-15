import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Dashboard.css';

function Dashboard() {
  const { cliente, logout } = useAuth();
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proyectos');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [proyectosRes, presupuestosRes, documentosRes] = await Promise.all([
        api.get('/portal/proyectos'),
        api.get('/portal/presupuestos'),
        api.get('/portal/documentos')
      ]);

      setProyectos(proyectosRes.data.proyectos || []);
      setPresupuestos(presupuestosRes.data.presupuestos || []);
      setDocumentos(documentosRes.data.documentos || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const descargarDocumento = async (documentoId, nombre) => {
    try {
      const response = await api.get(`/portal/documentos/${documentoId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombre);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error al descargar el documento');
      console.error(error);
    }
  };

  const aceptarPresupuesto = async (presupuestoId) => {
    if (!window.confirm('¿Estás seguro de aceptar este presupuesto?')) return;

    try {
      await api.patch(`/portal/presupuestos/${presupuestoId}/aceptar`);
      alert('Presupuesto aceptado exitosamente');
      cargarDatos();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al aceptar presupuesto');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const formatearMoneda = (cantidad) => {
    if (!cantidad) return '0,00 €';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cantidad);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Portal de Clientes</h1>
            <p>{cliente?.nombre_empresa}</p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'proyectos' ? 'active' : ''}`}
            onClick={() => setActiveTab('proyectos')}
          >
            Proyectos ({proyectos.length})
          </button>
          <button
            className={`tab ${activeTab === 'presupuestos' ? 'active' : ''}`}
            onClick={() => setActiveTab('presupuestos')}
          >
            Presupuestos ({presupuestos.length})
          </button>
          <button
            className={`tab ${activeTab === 'documentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('documentos')}
          >
            Documentos ({documentos.length})
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="dashboard-content">
        {/* Proyectos */}
        {activeTab === 'proyectos' && (
          <div className="content-section">
            <h2>Mis Proyectos</h2>
            {proyectos.length === 0 ? (
              <p className="empty-message">No tienes proyectos asignados</p>
            ) : (
              <div className="cards-grid">
                {proyectos.map((proyecto) => (
                  <div key={proyecto.id} className="card">
                    <div className="card-header">
                      <h3>{proyecto.nombre}</h3>
                      <span className={`badge badge-${proyecto.estado}`}>
                        {proyecto.estado}
                      </span>
                    </div>
                    <div className="card-body">
                      <p><strong>Descripción:</strong> {proyecto.descripcion || 'Sin descripción'}</p>
                      <p><strong>Ubicación:</strong> {proyecto.ubicacion || '-'}</p>
                      <p><strong>Inicio:</strong> {formatearFecha(proyecto.fecha_inicio)}</p>
                      <p><strong>Fin estimado:</strong> {formatearFecha(proyecto.fecha_fin_estimada)}</p>
                      {proyecto.presupuesto_estimado && (
                        <p><strong>Presupuesto:</strong> {formatearMoneda(proyecto.presupuesto_estimado)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Presupuestos */}
        {activeTab === 'presupuestos' && (
          <div className="content-section">
            <h2>Mis Presupuestos</h2>
            {presupuestos.length === 0 ? (
              <p className="empty-message">No tienes presupuestos disponibles</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Proyecto</th>
                      <th>Fecha</th>
                      <th>Subtotal</th>
                      <th>IVA</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuestos.map((presupuesto) => (
                      <tr key={presupuesto.id}>
                        <td>{presupuesto.numero_presupuesto}</td>
                        <td>{presupuesto.proyecto_nombre}</td>
                        <td>{formatearFecha(presupuesto.fecha_emision)}</td>
                        <td>{formatearMoneda(presupuesto.subtotal)}</td>
                        <td>{presupuesto.iva}%</td>
                        <td><strong>{formatearMoneda(presupuesto.total)}</strong></td>
                        <td>
                          <span className={`badge badge-${presupuesto.aceptado ? 'aceptado' : presupuesto.estado}`}>
                            {presupuesto.aceptado ? 'Aceptado' : presupuesto.estado}
                          </span>
                        </td>
                        <td>
                          {!presupuesto.aceptado && presupuesto.estado === 'enviado' && (
                            <button
                              onClick={() => aceptarPresupuesto(presupuesto.id)}
                              className="btn-accept"
                            >
                              Aceptar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Documentos */}
        {activeTab === 'documentos' && (
          <div className="content-section">
            <h2>Mis Documentos</h2>
            {documentos.length === 0 ? (
              <p className="empty-message">No tienes documentos disponibles</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Proyecto</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Tamaño</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.nombre}</td>
                        <td>{doc.proyecto_nombre}</td>
                        <td><span className="badge">{doc.tipo_documento}</span></td>
                        <td>{formatearFecha(doc.created_at)}</td>
                        <td>{(doc.tamano_bytes / 1024).toFixed(2)} KB</td>
                        <td>
                          <button
                            onClick={() => descargarDocumento(doc.id, doc.nombre)}
                            className="btn-download"
                          >
                            Descargar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;