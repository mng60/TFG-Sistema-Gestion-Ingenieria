import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import clienteService from '../services/clienteService';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import ActivarAccesoModal from '../components/ActivarAccesoModal';
import '../styles/GestionPages.css';
import { Search, Plus, Pencil, Trash2, KeyRound, Lock } from 'lucide-react';

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
    persona_contacto: '',
    email: '',
    email_personal: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    notas: '',
    activo: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    document.title = 'Panel Interno - Clientes';
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const data = await clienteService.getAll();
      setClientes(data.clientes || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      showToast('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    if (filtroActivo !== 'todos') {
      const esActivo = filtroActivo === 'activos';
      if (cliente.activo !== esActivo) return false;
    }
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cliente.nombre_empresa?.toLowerCase().includes(searchLower) ||
      cliente.cif?.toLowerCase().includes(searchLower) ||
      cliente.persona_contacto?.toLowerCase().includes(searchLower) ||
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
      persona_contacto: '',
      email: '',
      email_personal: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      codigo_postal: '',
      notas: '',
      activo: true
    });
    setFormErrors({});
    setShowModal(true);
  };

  const abrirModalEditar = (cliente) => {
    setModalMode('editar');
    setClienteSeleccionado(cliente);
    setFormData({
      nombre_empresa: cliente.nombre_empresa || '',
      cif: cliente.cif || '',
      persona_contacto: cliente.persona_contacto || '',
      email: cliente.email || '',
      email_personal: cliente.email_personal || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      codigo_postal: cliente.codigo_postal || '',
      notas: cliente.notas || '',
      activo: cliente.activo
    });
    setFormErrors({});
    setShowModal(true);
  };

  const abrirModalActivar = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowActivarModal(true);
  };

  const handleDesactivarAcceso = (cliente) => {
    setConfirmModal({
      title: 'Desactivar acceso al portal',
      message: `¿Seguro que quieres desactivar el acceso al portal de "${cliente.nombre_empresa}"? El cliente no podrá iniciar sesión hasta que lo reactives.`,
      type: 'warning',
      confirmText: 'Sí, desactivar',
      onConfirm: async () => {
        try {
          await clienteService.desactivarAcceso(cliente.id);
          showToast('Acceso al portal desactivado', 'success');
          cargarClientes();
        } catch {
          showToast('Error al desactivar acceso', 'error');
        }
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let filtered = value;
    if (name === 'telefono') filtered = value.replace(/[^0-9+\-\s]/g, '');
    else if (name === 'codigo_postal') filtered = value.replace(/[^0-9]/g, '').slice(0, 5);
    else if (name === 'cif') filtered = value.toUpperCase().slice(0, 9);
    else if (name === 'persona_contacto') filtered = value.replace(/[0-9]/g, '');
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : filtered
    });
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nombre_empresa.trim()) errors.nombre_empresa = 'Campo obligatorio';
    const cifRegex = /^[A-Z][0-9]{7}[A-Z0-9]$/;
    if (!formData.cif) errors.cif = 'Campo obligatorio';
    else if (!cifRegex.test(formData.cif)) errors.cif = 'CIF inválido — debe ser 1 letra, 7 dígitos y 1 carácter (ej: A1234567B)';
    if (!formData.persona_contacto.trim()) errors.persona_contacto = 'Campo obligatorio';
    if (!formData.email.trim()) errors.email = 'Campo obligatorio';
    if (!formData.email_personal.trim()) errors.email_personal = 'Campo obligatorio';
    const telefonoDigits = formData.telefono.replace(/[^0-9]/g, '');
    if (!formData.telefono.trim()) errors.telefono = 'Campo obligatorio';
    else if (telefonoDigits.length < 9) errors.telefono = 'Introduce un teléfono válido (mín. 9 dígitos)';
    if (!formData.direccion.trim()) errors.direccion = 'Campo obligatorio';
    if (!formData.ciudad.trim()) errors.ciudad = 'Campo obligatorio';
    if (!formData.codigo_postal) errors.codigo_postal = 'Campo obligatorio';
    else if (formData.codigo_postal.length !== 5) errors.codigo_postal = 'El código postal debe tener 5 dígitos';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

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
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando clientes...</p>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="page-header">
        <div>
          <h1>Gestión de Clientes</h1>
          <p>Administra la información de tus clientes</p>
        </div>
        {isAdmin() && (
          <button className="btn-primary" onClick={abrirModalCrear}>
            <Plus size={18}/> Nuevo Cliente
          </button>
        )}
      </header>

      <div className="filters-bar">
        <Search size={16} color="rgba(255,255,255,0.5)" className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, CIF, contacto o email..."
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
                    <td>{cliente.persona_contacto}</td>
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
                          <Pencil size={14} />
                        </button>
                        {isAdmin() && (
                          <>
                            {cliente.activo_login ? (
                              <button
                                className="btn-sm btn-warning"
                                onClick={() => handleDesactivarAcceso(cliente)}
                                title="Desactivar acceso portal"
                              >
                                <Lock size={14} />
                              </button>
                            ) : (
                              <button
                                className="btn-sm btn-access"
                                onClick={() => abrirModalActivar(cliente)}
                                title="Activar acceso portal"
                              >
                                <KeyRound size={14} />
                              </button>
                            )}
                            <button
                              className="btn-sm btn-danger"
                              onClick={() => handleEliminar(cliente)}
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
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
        <div className="modal-overlay" onClick={() => { setShowModal(false); setFormErrors({}); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'crear' ? 'Nuevo Cliente' : 'Editar Cliente'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); setFormErrors({}); }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form" noValidate>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Nombre de la Empresa *</label>
                  <input
                    type="text"
                    name="nombre_empresa"
                    value={formData.nombre_empresa}
                    onChange={handleInputChange}
                    className={formErrors.nombre_empresa ? 'input-error' : ''}
                  />
                  {formErrors.nombre_empresa && <span className="field-error">{formErrors.nombre_empresa}</span>}
                </div>

                <div className="form-group">
                  <label>CIF *</label>
                  <input
                    type="text"
                    name="cif"
                    value={formData.cif}
                    onChange={handleInputChange}
                    placeholder="A1234567B"
                    className={formErrors.cif ? 'input-error' : ''}
                  />
                  {formErrors.cif && <span className="field-error">{formErrors.cif}</span>}
                </div>

                <div className="form-group">
                  <label>Nombre Contacto *</label>
                  <input
                    type="text"
                    name="persona_contacto"
                    value={formData.persona_contacto}
                    onChange={handleInputChange}
                    className={formErrors.persona_contacto ? 'input-error' : ''}
                  />
                  {formErrors.persona_contacto && <span className="field-error">{formErrors.persona_contacto}</span>}
                </div>

                <div className="form-group">
                  <label>Email de acceso (login) *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={formErrors.email ? 'input-error' : ''}
                  />
                  {formErrors.email && <span className="field-error">{formErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Email personal (notificaciones) *</label>
                  <input
                    type="email"
                    name="email_personal"
                    value={formData.email_personal}
                    onChange={handleInputChange}
                    placeholder="contacto@gmail.com"
                    className={formErrors.email_personal ? 'input-error' : ''}
                  />
                  {formErrors.email_personal && <span className="field-error">{formErrors.email_personal}</span>}
                </div>

                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    inputMode="tel"
                    placeholder="600 000 000"
                    className={formErrors.telefono ? 'input-error' : ''}
                  />
                  {formErrors.telefono && <span className="field-error">{formErrors.telefono}</span>}
                </div>

                <div className="form-group form-group-full">
                  <label>Dirección *</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className={formErrors.direccion ? 'input-error' : ''}
                  />
                  {formErrors.direccion && <span className="field-error">{formErrors.direccion}</span>}
                </div>

                <div className="form-group">
                  <label>Ciudad *</label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    className={formErrors.ciudad ? 'input-error' : ''}
                  />
                  {formErrors.ciudad && <span className="field-error">{formErrors.ciudad}</span>}
                </div>

                <div className="form-group">
                  <label>Código Postal *</label>
                  <input
                    type="text"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength="5"
                    placeholder="03001"
                    className={formErrors.codigo_postal ? 'input-error' : ''}
                  />
                  {formErrors.codigo_postal && <span className="field-error">{formErrors.codigo_postal}</span>}
                </div>

                <div className="form-group form-group-full">
                  <label>Notas internas</label>
                  <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Observaciones internas sobre el cliente..."
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
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setFormErrors({}); }}>
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
          onConfirm={async (password) => {
            try {
              await clienteService.activarAcceso(clienteSeleccionado.id, password);
              showToast('Acceso al portal activado', 'success');
              setShowActivarModal(false);
              cargarClientes();
            } catch (err) {
              showToast(err.response?.data?.message || 'Error al activar acceso', 'error');
            }
          }}
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
    </>
  );
}

export default Clientes;