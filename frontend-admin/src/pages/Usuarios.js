import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import usuarioService from '../services/usuarioService';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/GestionPages.css';
import { Eye, EyeOff, Search, Plus, Pencil, Trash2 } from 'lucide-react'

function Usuarios() {
  const { empleado, isAdmin } = useEmpleadoAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'empleado',
    telefono: '',
    email_personal: ''
  });

  useEffect(() => {
    document.title = 'Panel Interno - Usuarios';
    
    // Solo admin puede acceder
    if (!isAdmin()) {
      showToast('Solo administradores pueden gestionar usuarios', 'error');
      navigate('/dashboard');
      return;
    }

    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuarioService.getAll();
      setUsuarios(data.users || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado local
  const usuariosFiltrados = usuarios.filter(user => {
    const matchSearch = !search || 
      user.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchRol = filtroRol === 'todos' || user.rol === filtroRol;
    
    return matchSearch && matchRol;
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const abrirModalCrear = () => {
    setModalMode('crear');
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'empleado',
      telefono: '',
      email_personal: ''
    });
    setShowPass(false);
    setShowModal(true);
  };

  const abrirModalEditar = (usuario) => {
    setModalMode('editar');
    setUsuarioSeleccionado(usuario);
    setFormData({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '',
      rol: usuario.rol || 'empleado',
      telefono: usuario.telefono || '',
      email_personal: usuario.email_personal || ''
    });
    setShowPass(false);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (e.target.name === 'telefono') val = val.replace(/[^0-9+\-\s]/g, '');
    else if (e.target.name === 'nombre') val = val.replace(/[0-9]/g, '');
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSend = { ...formData };
      
      if (modalMode === 'editar' && !formData.password) {
        delete dataToSend.password;
      }

      if (modalMode === 'crear') {
        await usuarioService.create(dataToSend);
        showToast('Usuario creado exitosamente', 'success');
      } else {
        await usuarioService.update(usuarioSeleccionado.id, dataToSend);
        showToast('Usuario actualizado exitosamente', 'success');
      }
      
      setShowModal(false);
      cargarUsuarios();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al guardar usuario', 'error');
    }
  };

  const handleEliminar = (usuario) => {
    if (usuario.id === empleado.id) {
      showToast('No puedes eliminarte a ti mismo', 'error');
      return;
    }

    if (usuario.email === 'miguel@test.com') {
      showToast('no puedes uwu', 'error');
      return;
    }

    setConfirmModal({
      title: '⚠️ Eliminar Usuario',
      message: `¿Eliminar al usuario "${usuario.nombre}"? Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Sí, Eliminar',
      onConfirm: async () => {
        try {
          await usuarioService.delete(usuario.id);
          showToast('Usuario eliminado', 'success');
          cargarUsuarios();
        } catch (error) {
          showToast(error.response?.data?.message || 'Error al eliminar usuario', 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="page-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra empleados y permisos del sistema</p>
        </div>
        <button className="btn-primary" onClick={abrirModalCrear}>
          <Plus size={18}/> Nuevo Usuario
        </button>
      </header>

      <div className="filters-bar">
        <Search size={16} color="rgba(255,255,255,0.5)" className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={filtroRol} 
          onChange={(e) => setFiltroRol(e.target.value)}
          className="filter-select"
        >
          <option value="todos">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="empleado">Empleados</option>
        </select>
      </div>

      <div className="content-card">
        {usuariosFiltrados.length === 0 ? (
          <p className="empty-message">
            {search ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <strong>{usuario.nombre}</strong>
                      {usuario.id === empleado.id && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '0.8rem', 
                          color: '#667eea',
                          fontWeight: 'bold'
                        }}>
                          (Tú)
                        </span>
                      )}
                    </td>
                    <td>{usuario.email}</td>
                    <td>{usuario.telefono || '-'}</td>
                    <td>
                      <span className={`badge ${usuario.rol === 'admin' ? 'badge-admin' : 'badge-empleado'}`}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-sm btn-edit"
                          onClick={() => abrirModalEditar(usuario)}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        {usuario.id !== empleado.id && (
                          <button
                            className="btn-sm btn-danger"
                            onClick={() => handleEliminar(usuario)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
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
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Juan Pérez García"
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
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div className="form-group">
                <label>
                  {modalMode === 'crear' ? 'Contraseña *' : 'Contraseña (dejar vacío para no cambiar)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={modalMode === 'crear'}
                    placeholder="Mínimo 6 caracteres"
                    minLength="6"
                    style={{ width: '100%', paddingRight: 38, boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7f8c8d', padding: 0, display: 'flex' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Rol *</label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                  required
                >
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="600 000 000"
                  maxLength="15"
                  inputMode="tel"
                />
              </div>

              <div className="form-group">
                <label>Email personal (notificaciones) *</label>
                <input
                  type="email"
                  name="email_personal"
                  value={formData.email_personal}
                  onChange={handleInputChange}
                  required
                  placeholder="personal@gmail.com"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
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

export default Usuarios;