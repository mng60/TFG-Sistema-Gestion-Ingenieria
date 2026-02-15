import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import clienteService from '../services/clienteService';
import Toast from '../components/Toast';
import ActivarAccesoModal from '../components/ActivarAccesoModal';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/GestionPages.css';

function Clientes() {
  const { empleado, logout, isAdmin } = useEmpleadoAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('true');
  const [showModal, setShowModal] = useState(false);
  const [showActivarModal, setShowActivarModal] = useState(false);
  const [clienteParaActivar, setClienteParaActivar] = useState(null);
  const [modalMode, setModalMode] = useState('crear');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    nombre_empresa: '',
    cif: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    provincia: '',
    persona_contacto: '',
    telefono_contacto: '',
    email_contacto: '',
    datos_fiscales: '',
    notas: ''
  });

  useEffect(() => {
    document.title = 'Panel Interno - Clientes';
    cargarClientes();
  }, [filtroActivo]); // Removido search para que no recargue al escribir

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const filtros = {};
      //if (search) filtros.search = search;
      if (filtroActivo !== 'todos') filtros.activo = filtroActivo === 'true';

      const data = await clienteService.getAll(filtros);
      setClientes(data.clientes || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      showToast('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes localmente (sin llamadas al backend)
  const clientesFiltrados = clientes.filter(cliente => {
    if (!search) return true; // Si no hay búsqueda, mostrar todos
    
    const searchLower = search.toLowerCase();
    return (
      cliente.nombre_empresa?.toLowerCase().includes(searchLower) ||
      cliente.cif?.toLowerCase().includes(searchLower) ||
      cliente.email?.toLowerCase().includes(searchLower) ||
      cliente.ciudad?.toLowerCase().includes(searchLower)
    );
  });

  // Buscar al presionar Enter o al hacer clic en buscar
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    cargarClientes();
  };

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
      nombre_empresa: '',
      cif: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      codigo_postal: '',
      provincia: '',
      persona_contacto: '',
      telefono_contacto: '',
      email_contacto: '',
      datos_fiscales: '',
      notas: ''
    });
    setShowModal(true);
  };

  const abrirModalEditar = (cliente) => {
    setModalMode('editar');
    setClienteSeleccionado(cliente);
    setFormData({
      nombre_empresa: cliente.nombre_empresa || '',
      cif: cliente.cif || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      codigo_postal: cliente.codigo_postal || '',
      provincia: cliente.provincia || '',
      persona_contacto: cliente.persona_contacto || '',
      telefono_contacto: cliente.telefono_contacto || '',
      email_contacto: cliente.email_contacto || '',
      datos_fiscales: cliente.datos_fiscales || '',
      notas: cliente.notas || ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'crear') {
        await clienteService.create(formData);
        showToast('Cliente creado exitosamente', 'success');
      } else {
        await clienteService.update(clienteSeleccionado.id, formData);
        showToast('Cliente actualizado exitosamente', 'success');
      }
      
      setShowModal(false);
      cargarClientes();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al guardar cliente', 'error');
    }
  };

  const handleDesactivar = (cliente) => {
    setConfirmModal({
      title: 'Desactivar Cliente',
      message: `¿Estás seguro de desactivar a ${cliente.nombre_empresa}? El cliente no podrá acceder al portal pero se conservará su información.`,
      type: 'warning',
      confirmText: 'Desactivar',
      onConfirm: async () => {
        try {
          await clienteService.deactivate(cliente.id);
          showToast('Cliente desactivado', 'success');
          cargarClientes();
        } catch (error) {
          showToast('Error al desactivar cliente', 'error');
        }
      }
    });
  };

  const handleEliminar = (cliente) => {
    setConfirmModal({
      title: '⚠️ Eliminar Cliente Permanentemente',
      message: `¿ELIMINAR permanentemente a ${cliente.nombre_empresa}? Esta acción NO se puede deshacer y se perderán todos los datos asociados.`,
      type: 'danger',
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await clienteService.delete(cliente.id);
          showToast('Cliente eliminado', 'success');
          cargarClientes();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al eliminar cliente', 'error');
        }
      }
    });
  };

  const abrirModalActivarAcceso = (cliente) => {
    setClienteParaActivar(cliente);
    setShowActivarModal(true);
  };

  const handleActivarAcceso = async (password) => {
    try {
      await clienteService.activarAcceso(clienteParaActivar.id, password);
      showToast('Acceso al portal activado exitosamente', 'success');
      setShowActivarModal(false);
      setClienteParaActivar(null);
      cargarClientes();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al activar acceso', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando clientes...</p>
      </div>
    );
  }
  return (
    <div className="admin-layout">
      {/* Toast de notificaciones */}
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
          <button className="nav-item active" onClick={() => navigate('/clientes')}>
            👥 Clientes
          </button>
          <button className="nav-item" onClick={() => navigate('/proyectos')}>
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
            <h1>Gestión de Clientes</h1>
            <p>Administra las empresas clientes del sistema</p>
          </div>
          {isAdmin() && (
            <button className="btn-primary" onClick={abrirModalCrear}>
              ➕ Nuevo Cliente
            </button>
          )}
        </header>

        {/* Filtros */}
        <form onSubmit={handleSearchSubmit} className="filters-bar">
          <input
            type="text"
            placeholder="Buscar por nombre, CIF, email o ciudad ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={filtroActivo} 
            onChange={(e) => setFiltroActivo(e.target.value)}
            className="filter-select"
          >
            <option value="todos">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>

          <button type="submit" className="btn-primary">
            🔍 Buscar
          </button>
        </form>

        {/* Lista de Clientes */}
        <div className="content-card">
          {clientesFiltrados.length === 0 ? (
            <p className="empty-message">
            {search ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados'}
            </p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>CIF</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Ciudad</th>
                    <th>Estado</th>
                    <th>Portal</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id}>
                      <td><strong>{cliente.nombre_empresa}</strong></td>
                      <td>{cliente.cif}</td>
                      <td>{cliente.email}</td>
                      <td>{cliente.telefono}</td>
                      <td>{cliente.ciudad}</td>
                      <td>
                        <span className={`badge ${cliente.activo ? 'badge-active' : 'badge-inactive'}`}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${cliente.activo_login ? 'badge-active' : 'badge-inactive'}`}>
                          {cliente.activo_login ? 'Activado' : 'Sin acceso'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-sm btn-edit"
                            onClick={() => abrirModalEditar(cliente)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          {isAdmin() && cliente.activo && (
                            <>
                              {!cliente.activo_login && (
                                <button 
                                  className="btn-sm btn-access"
                                  onClick={() => abrirModalActivarAcceso(cliente)}
                                  title="Activar acceso portal"
                                >
                                  🔑
                                </button>
                              )}
                              <button 
                                className="btn-sm btn-warning"
                                onClick={() => handleDesactivar(cliente)}
                                title="Desactivar"
                              >
                                ⏸️
                              </button>
                              <button 
                                className="btn-sm btn-danger"
                                onClick={() => handleEliminar(cliente)}
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

      {/* Modal Crear/Editar (igual que antes, sin cambios) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
<div className="modal-header">
              <h2>{modalMode === 'crear' ? 'Nuevo Cliente' : 'Editar Cliente'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre Empresa *</label>
                  <input
                    type="text"
                    name="nombre_empresa"
                    value={formData.nombre_empresa}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>CIF *</label>
                  <input
                    type="text"
                    name="cif"
                    value={formData.cif}
                    onChange={handleInputChange}
                    maxLength="9"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Código Postal</label>
                  <input
                    type="text"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Provincia</label>
                  <input
                    type="text"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Persona Contacto</label>
                  <input
                    type="text"
                    name="persona_contacto"
                    value={formData.persona_contacto}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono Contacto</label>
                  <input
                    type="tel"
                    name="telefono_contacto"
                    value={formData.telefono_contacto}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Email Contacto</label>
                  <input
                    type="email"
                    name="email_contacto"
                    value={formData.email_contacto}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Notas</label>
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'crear' ? 'Crear Cliente' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Activar Acceso */}
      {showActivarModal && clienteParaActivar && (
        <ActivarAccesoModal
          cliente={clienteParaActivar}
          onClose={() => {
            setShowActivarModal(false);
            setClienteParaActivar(null);
          }}
          onConfirm={handleActivarAcceso}
        />
      )}

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

export default Clientes;