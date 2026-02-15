import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import proyectoService from '../services/proyectoService';
import clienteService from '../services/clienteService';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/GestionPages.css';

function Proyectos() {
  const { empleado, logout, isAdmin } = useEmpleadoAuth();
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cliente_id: '',
    estado: 'pendiente',
    prioridad: 'media',
    fecha_inicio: '',
    fecha_fin_estimada: '',
    fecha_fin_real: '',
    presupuesto_estimado: '',
    presupuesto_real: '',
    responsable_id: '',
    ubicacion: '',
    notas: ''
  });

  const [asignarForm, setAsignarForm] = useState({
    user_id: '',
    rol_proyecto: ''
  });

  useEffect(() => {
    document.title = 'Panel Interno - Proyectos';
    cargarDatos();
  }, [filtroEstado, filtroPrioridad]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const filtros = {};
      if (filtroEstado !== 'todos') filtros.estado = filtroEstado;
      if (filtroPrioridad !== 'todos') filtros.prioridad = filtroPrioridad;

      const [proyectosData, clientesData] = await Promise.all([
        proyectoService.getAll(filtros),
        clienteService.getAll({ activo: true })
      ]);

      setProyectos(proyectosData.proyectos || []);
      setClientes(clientesData.clientes || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado local
  const proyectosFiltrados = proyectos.filter(proyecto => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      proyecto.nombre?.toLowerCase().includes(searchLower) ||
      proyecto.cliente_nombre?.toLowerCase().includes(searchLower) ||
      proyecto.ubicacion?.toLowerCase().includes(searchLower) ||
      proyecto.responsable_nombre?.toLowerCase().includes(searchLower)
    );
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const abrirModalCrear = () => {
    setModalMode('crear');
    setFormData({
      nombre: '',
      descripcion: '',
      cliente_id: '',
      estado: 'pendiente',
      prioridad: 'media',
      fecha_inicio: '',
      fecha_fin_estimada: '',
      fecha_fin_real: '',
      presupuesto_estimado: '',
      presupuesto_real: '',
      responsable_id: '',
      ubicacion: '',
      notas: ''
    });
    setShowModal(true);
  };

  const abrirModalEditar = (proyecto) => {
    setModalMode('editar');
    setProyectoSeleccionado(proyecto);
    setFormData({
      nombre: proyecto.nombre || '',
      descripcion: proyecto.descripcion || '',
      cliente_id: proyecto.cliente_id || '',
      estado: proyecto.estado || 'pendiente',
      prioridad: proyecto.prioridad || 'media',
      fecha_inicio: proyecto.fecha_inicio?.split('T')[0] || '',
      fecha_fin_estimada: proyecto.fecha_fin_estimada?.split('T')[0] || '',
      fecha_fin_real: proyecto.fecha_fin_real?.split('T')[0] || '',
      presupuesto_estimado: proyecto.presupuesto_estimado || '',
      presupuesto_real: proyecto.presupuesto_real || '',
      responsable_id: proyecto.responsable_id || '',
      ubicacion: proyecto.ubicacion || '',
      notas: proyecto.notas || ''
    });
    setShowModal(true);
  };

  const abrirModalAsignar = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setAsignarForm({ user_id: '', rol_proyecto: '' });
    setShowAsignarModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAsignarInputChange = (e) => {
    const { name, value } = e.target;
    setAsignarForm({ ...asignarForm, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'crear') {
        await proyectoService.create(formData);
        showToast('Proyecto creado exitosamente', 'success');
      } else {
        await proyectoService.update(proyectoSeleccionado.id, formData);
        showToast('Proyecto actualizado exitosamente', 'success');
      }
      
      setShowModal(false);
      cargarDatos();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al guardar proyecto', 'error');
    }
  };

  const handleAsignarEmpleado = async (e) => {
    e.preventDefault();
    
    try {
      await proyectoService.asignarEmpleado(proyectoSeleccionado.id, asignarForm);
      showToast('Empleado asignado exitosamente', 'success');
      setShowAsignarModal(false);
      cargarDatos();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al asignar empleado', 'error');
    }
  };

  const handleEliminar = (proyecto) => {
    setConfirmModal({
      title: '⚠️ Eliminar Proyecto',
      message: `¿Eliminar el proyecto "${proyecto.nombre}"? Se perderán todos los datos asociados (presupuestos, documentos, asignaciones).`,
      type: 'danger',
      confirmText: 'Sí, Eliminar',
      onConfirm: async () => {
        try {
          await proyectoService.delete(proyecto.id);
          showToast('Proyecto eliminado', 'success');
          cargarDatos();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al eliminar proyecto', 'error');
        }
      }
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const formatearMoneda = (cantidad) => {
    if (!cantidad) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cantidad);
  };

  const getBadgeEstado = (estado) => {
    const badges = {
      pendiente: 'badge-pendiente',
      en_progreso: 'badge-en_progreso',
      pausado: 'badge-pausado',
      completado: 'badge-completado',
      cancelado: 'badge-cancelado'
    };
    return badges[estado] || '';
  };

  const getBadgePrioridad = (prioridad) => {
    const badges = {
      baja: 'badge-baja',
      media: 'badge-media',
      alta: 'badge-alta',
      urgente: 'badge-urgente'
    };
    return badges[prioridad] || '';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>SGI</h2>
          <p>Sistema de Gestión</p>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/dashboard')}>
            📊 Dashboard
          </button>
          <button className="nav-item" onClick={() => navigate('/clientes')}>
            👥 Clientes
          </button>
          <button className="nav-item active" onClick={() => navigate('/proyectos')}>
            📁 Proyectos
          </button>
          <button className="nav-item" onClick={() => navigate('/presupuestos')}>
            💰 Presupuestos
          </button>
          <button className="nav-item" onClick={() => navigate('/documentos')}>
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
        <header className="page-header">
          <div>
            <h1>Gestión de Proyectos</h1>
            <p>Administra todos los proyectos de ingeniería</p>
          </div>
          {isAdmin() && (
            <button className="btn-primary" onClick={abrirModalCrear}>
              ➕ Nuevo Proyecto
            </button>
          )}
        </header>

        {/* Filtros */}
        <div className="filters-bar">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, cliente, ubicación o responsable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En Progreso</option>
            <option value="pausado">Pausado</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select 
            value={filtroPrioridad} 
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        {/* Lista de Proyectos */}
        <div className="content-card">
          {proyectosFiltrados.length === 0 ? (
            <p className="empty-message">
              {search ? 'No se encontraron proyectos con ese criterio' : 'No hay proyectos registrados'}
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Cliente</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Inicio</th>
                    <th>Presupuesto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proyectosFiltrados.map((proyecto) => (
                    <tr key={proyecto.id}>
                      <td>
                        <strong>{proyecto.nombre}</strong>
                        {proyecto.ubicacion && (
                          <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                            📍 {proyecto.ubicacion}
                          </div>
                        )}
                      </td>
                      <td>{proyecto.cliente_nombre}</td>
                      <td>{proyecto.responsable_nombre || '-'}</td>
                      <td>
                        <span className={`badge ${getBadgeEstado(proyecto.estado)}`}>
                          {proyecto.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getBadgePrioridad(proyecto.prioridad)}`}>
                          {proyecto.prioridad}
                        </span>
                      </td>
                      <td>{formatearFecha(proyecto.fecha_inicio)}</td>
                      <td>{formatearMoneda(proyecto.presupuesto_estimado)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-sm btn-edit"
                            onClick={() => abrirModalEditar(proyecto)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          {isAdmin() && (
                            <>
                              <button 
                                className="btn-sm btn-access"
                                onClick={() => abrirModalAsignar(proyecto)}
                                title="Asignar empleados"
                              >
                                👤
                              </button>
                              <button 
                                className="btn-sm btn-danger"
                                onClick={() => handleEliminar(proyecto)}
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'crear' ? 'Nuevo Proyecto' : 'Editar Proyecto'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Nombre del Proyecto *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Instalación Eléctrica Edificio Central"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Descripción detallada del proyecto..."
                  />
                </div>

                <div className="form-group">
                  <label>Cliente *</label>
                  <select
                    name="cliente_id"
                    value={formData.cliente_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre_empresa}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Responsable</label>
                  <select
                    name="responsable_id"
                    value={formData.responsable_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Sin asignar...</option>
                    <option value={empleado.id}>{empleado.nombre}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado *</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="pausado">Pausado</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioridad *</label>
                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Fin Estimada</label>
                  <input
                    type="date"
                    name="fecha_fin_estimada"
                    value={formData.fecha_fin_estimada}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Presupuesto Estimado (€)</label>
                  <input
                    type="number"
                    name="presupuesto_estimado"
                    value={formData.presupuesto_estimado}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Presupuesto Real (€)</label>
                  <input
                    type="number"
                    name="presupuesto_real"
                    value={formData.presupuesto_real}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Ubicación</label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    placeholder="Dirección del proyecto"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Notas</label>
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'crear' ? 'Crear Proyecto' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Empleado */}
      {showAsignarModal && proyectoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowAsignarModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Asignar Empleado</h2>
              <button className="modal-close" onClick={() => setShowAsignarModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAsignarEmpleado} className="modal-form">
              <p className="modal-description">
                Asignar empleado al proyecto: <strong>{proyectoSeleccionado.nombre}</strong>
              </p>

              <div className="form-group">
                <label>Empleado *</label>
                <select
                  name="user_id"
                  value={asignarForm.user_id}
                  onChange={handleAsignarInputChange}
                  required
                >
                  <option value="">Seleccionar empleado...</option>
                  <option value={empleado.id}>{empleado.nombre} (Tú)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rol en el Proyecto *</label>
                <input
                  type="text"
                  name="rol_proyecto"
                  value={asignarForm.rol_proyecto}
                  onChange={handleAsignarInputChange}
                  placeholder="Ej: Ingeniero eléctrico principal"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAsignarModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Asignar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

export default Proyectos;