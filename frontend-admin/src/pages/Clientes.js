import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import AdminLayout from '../components/Layout/AdminLayout';
import clienteService from '../services/clienteService';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import ActivarAccesoModal from '../components/ActivarAccesoModal';
import '../styles/GestionPages.css';

function Clientes() {
  const { isAdmin } = useEmpleadoAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [showActivarModal, setShowActivarModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const [formData, setFormData] = useState({
    nombre_empresa: '',
    cif: '',
    nombre_contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    activo: true
  });

  useEffect(() => {
    document.title = 'Panel Interno - Clientes';
    cargarClientes();
  }, [filtroActivo]);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const filtros = {};
      if (filtroActivo !== 'todos') {
        filtros.activo = filtroActivo === 'activos';
      }

      const data = await clienteService.getAll(filtros);
      setClientes(data.clientes || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      showToast('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    return (
      cliente.nombre_empresa?.toLowerCase().includes(searchLower) ||
      cliente.cif?.toLowerCase().includes(searchLower) ||
      cliente.nombre_contacto?.toLowerCase().includes(searchLower) ||
      cliente.email?.toLowerCase().includes(searchLower)
    );
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const abrirModalCrear = () => {
    setModalMode('crear');
    setFormData({
      nombre_empresa: '',
      cif: '',
      nombre_contacto: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      codigo_postal: '',
      activo: true
    });
    setShowModal(true);
  };

  const abrirModalEditar = (cliente) => {
    setModalMode('editar');
    setClienteSeleccionado(cliente);
    setFormData({
      nombre_empresa: cliente.nombre_empresa || '',
      cif: cliente.cif || '',
      nombre_contacto: cliente.nombre_contacto || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      codigo_postal: cliente.codigo_postal || '',
      activo: cliente.activo
    });
    setShowModal(true);
  };

  const abrirModalActivar = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowActivarModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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

  const handleEliminar = (cliente) => {
    setConfirmModal({
      title: '⚠️ Eliminar Cliente',
      message: `¿Eliminar al cliente "${cliente.nombre_empresa}"? Se eliminarán todos sus proyectos asociados.`,
      type: 'danger',
      confirmText: 'Sí, Eliminar',
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando clientes...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="page-header">
        <div>
          <h1>Gestión de Clientes</h1>
          <p>Administra la información de tus clientes</p>
        </div>
        {isAdmin() && (
          <button className="btn-primary" onClick={abrirModalCrear}>
            ➕ Nuevo Cliente
          </button>
        )}
      </header>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, CIF, contacto o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={filtroActivo} 
          onChange={(e) => setFiltroActivo(e.target.value)}
          className="filter-select"
        >
          <option value="todos">Todos los clientes</option>
          <option value="activos">Clientes activos</option>
          <option value="inactivos">Clientes inactivos</option>
        </select>
      </div>

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
                  <th>Contacto</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td><strong>{cliente.nombre_empresa}</strong></td>
                    <td>{cliente.cif}</td>
                    <td>{cliente.nombre_contacto}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.telefono || '-'}</td>
                    <td>
                      <span className={`badge ${cliente.activo ? 'badge-activo' : 'badge-inactivo'}`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
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
                        {isAdmin() && (
                          <>
                            <button 
                              className="btn-sm btn-access"
                              onClick={() => abrirModalActivar(cliente)}
                              title="Activar acceso portal"
                            >
                              🔑
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'crear' ? 'Nuevo Cliente' : 'Editar Cliente'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Nombre de la Empresa *</label>
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
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nombre Contacto *</label>
                  <input
                    type="text"
                    name="nombre_contacto"
                    value={formData.nombre_contacto}
                    onChange={handleInputChange}
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

                <div className="form-group form-group-full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                    />
                    <span>Cliente activo</span>
                  </label>
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

      {showActivarModal && clienteSeleccionado && (
        <ActivarAccesoModal
          cliente={clienteSeleccionado}
          onClose={() => setShowActivarModal(false)}
          onSuccess={() => {
            showToast('Acceso al portal activado', 'success');
            setShowActivarModal(false);
            cargarClientes();
          }}
          onError={(error) => showToast(error, 'error')}
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
    </AdminLayout>
  );
}

export default Clientes;