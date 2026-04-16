import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import proyectoService from '../services/proyectoService';
import clienteService from '../services/clienteService';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import usuarioService from '../services/usuarioService';
import '../styles/GestionPages.css';
import { Search, Plus, Pencil, Trash2, UserPlus } from 'lucide-react';
import EditarProyectoModal from '../components/modals/EditarProyectoModal';
import AsignarEmpleadoModal from '../components/modals/AsignarEmpleadoModal';
import { formatearFecha, formatearMoneda } from '../utils/format';

function Proyectos() {
  const { empleado, isAdmin } = useEmpleadoAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [proyectos, setProyectos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [empleadosAsignados, setEmpleadosAsignados] = useState([]);
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
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const filtros = {};

      const requests = [
        proyectoService.getAll(filtros),
        clienteService.getAll({ activo: true })
      ];

      if (isAdmin()) {
        requests.push(usuarioService.getAll());
      }

      const results = await Promise.all(requests);

      const proyectosData = results[0];
      const clientesData = results[1];
      const usuariosData = isAdmin() ? results[2] : { users: [] };

      setProyectos(proyectosData.proyectos || []);
      setClientes(clientesData.clientes || []);
      setUsuarios(usuariosData.users || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado local (search + filtros de URL)
  const proyectosFiltrados = (() => {
    const params = new URLSearchParams(location.search);
    const clienteIdURL = params.get('cliente_id') ? parseInt(params.get('cliente_id')) : null;
    const soloEmpleadoIdURL = params.get('solo_empleado_id') ? parseInt(params.get('solo_empleado_id')) : null;
    const empleadoIdURL = params.get('empleado_id') ? parseInt(params.get('empleado_id')) : null;

    return proyectos.filter(proyecto => {
      if (filtroEstado !== 'todos' && proyecto.estado !== filtroEstado) return false;
      if (filtroPrioridad !== 'todos' && proyecto.prioridad !== filtroPrioridad) return false;
      if (clienteIdURL && proyecto.cliente_id !== clienteIdURL) return false;
      const ids = (proyecto.empleados_ids || []).map(String);
      if (soloEmpleadoIdURL && !ids.includes(String(soloEmpleadoIdURL))) return false;
      if (empleadoIdURL && !ids.includes(String(empleadoIdURL))) return false;
      if (!search) return true;
      const sl = search.toLowerCase();
      return (
        proyecto.nombre?.toLowerCase().includes(sl) ||
        proyecto.cliente_nombre?.toLowerCase().includes(sl) ||
        proyecto.ubicacion?.toLowerCase().includes(sl) ||
        proyecto.responsable_nombre?.toLowerCase().includes(sl)
      );
    });
  })();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
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
    if (proyecto.estado === 'completado') {
      showToast('No se pueden editar proyectos completados', 'warning');
      return;
    }

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

  const abrirModalAsignar = async (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setAsignarForm({ user_id: '', rol_proyecto: '' });
    setEmpleadosAsignados([]);
    setShowAsignarModal(true);
    try {
      const data = await proyectoService.getEmpleados(proyecto.id);
      setEmpleadosAsignados(data.empleados || []);
    } catch {
      // no crítico, simplemente no filtramos si falla
    }
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
      const dataToSend = {
        ...formData,
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin_estimada: formData.fecha_fin_estimada || null,
        fecha_fin_real: formData.fecha_fin_real || null,
        presupuesto_estimado: formData.presupuesto_estimado || null,
        presupuesto_real: formData.presupuesto_real || null,
        responsable_id: formData.responsable_id || null
      };

      if (modalMode === 'crear') {
        await proyectoService.create(dataToSend);
        showToast('Proyecto creado exitosamente', 'success');
      } else {
        await proyectoService.update(proyectoSeleccionado.id, dataToSend);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando proyectos...</p>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="page-header">
        <div>
          <h1>Gestión de Proyectos</h1>
          <p>Administra los proyectos de la empresa</p>
          {/* Indicador de filtro activo */}
          {(() => {
            const params = new URLSearchParams(location.search);
            const clienteIdURL = params.get('cliente_id');
            const empleadoIdURL = params.get('empleado_id');
            const soloEmpleadoIdURL = params.get('solo_empleado_id');

            if (!clienteIdURL && !empleadoIdURL && !soloEmpleadoIdURL) return null;

            const nombreURL = params.get('nombre');
            const clienteNombre = nombreURL || clientes.find(c => c.id === parseInt(clienteIdURL))?.nombre_empresa;
            const empleadoNombre = nombreURL || usuarios.find(u => u.id === parseInt(empleadoIdURL || soloEmpleadoIdURL))?.nombre;
            const label = soloEmpleadoIdURL
              ? `Proyectos de ${empleadoNombre || `Empleado ID ${soloEmpleadoIdURL}`}`
              : empleadoIdURL
                ? `Proyectos compartidos con ${empleadoNombre || `Empleado ID ${empleadoIdURL}`}`
                : `Cliente: ${clienteNombre || `ID ${clienteIdURL}`}`;

            return (
              <div className="filter-indicator">
                <span><strong>Filtrado por:</strong> {label}</span>
                <button onClick={() => navigate('/proyectos')} className="btn-remove-filter">
                  ✕ Quitar filtro
                </button>
              </div>
            );
          })()}
        </div>
        {isAdmin() && (
          <button className="btn-primary" onClick={abrirModalCrear}>
            <Plus size={18}/> Nuevo Proyecto
          </button>
        )}
      </header>

      <div className="filters-bar">
        <Search size={16} color="rgba(255,255,255,0.5)" className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, cliente, ubicación o responsable..."
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
          <option value="pendiente">Pendientes</option>
          <option value="en_progreso">En Progreso</option>
          <option value="pausado">Pausados</option>
          <option value="completado">Completados</option>
          <option value="cancelado">Cancelados</option>
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
                  <th>Fecha Fin</th>
                  <th>Presupuestado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proyectosFiltrados.map((proyecto) => (
                  <tr key={proyecto.id}>
                    <td 
                      className="proyecto-nombre-clickable"
                      onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <strong>{proyecto.nombre}</strong>
                    </td>
                    <td>{proyecto.cliente_nombre || '-'}</td>
                    <td>{proyecto.responsable_nombre || 'Sin asignar'}</td>
                    <td>
                      <span className={`badge badge-${proyecto.estado}`}>
                        {proyecto.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${proyecto.prioridad}`}>
                        {proyecto.prioridad}
                      </span>
                    </td>
                    <td>{formatearFecha(proyecto.fecha_fin_estimada)}</td>
                    <td>
                      {proyecto.total_presupuestado > 0 
                        ? formatearMoneda(proyecto.total_presupuestado)
                        : <span style={{ color: '#95a5a6', fontSize: '0.85rem' }}>Sin presupuesto</span>
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        {isAdmin() && (
                          <>
                            <button
                              className="btn-sm btn-edit"
                              onClick={() => abrirModalEditar(proyecto)}
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn-sm btn-warning"
                              onClick={() => abrirModalAsignar(proyecto)}
                              title="Asignar empleado"
                            >
                              <UserPlus size={14} />
                            </button>
                            <button
                              className="btn-sm btn-danger"
                              onClick={() => handleEliminar(proyecto)}
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

      {/* Modal Crear Proyecto */}
      {showModal && modalMode === 'crear' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Proyecto</h2>
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
                    placeholder="Ej: Instalación eléctrica industrial"
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
                    {usuarios.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.nombre} ({user.rol})
                      </option>
                    ))}
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
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Proyecto */}
      {showModal && modalMode === 'editar' && proyectoSeleccionado && (
        <EditarProyectoModal
          proyecto={proyectoSeleccionado}
          clientes={clientes}
          usuarios={usuarios}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); cargarDatos(); showToast('Proyecto actualizado', 'success'); }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Modal Asignar Empleado */}
      {showAsignarModal && proyectoSeleccionado && (
        <AsignarEmpleadoModal
          proyectoId={proyectoSeleccionado.id}
          usuarios={usuarios}
          empleadosProyecto={empleadosAsignados}
          onClose={() => setShowAsignarModal(false)}
          onSuccess={() => { setShowAsignarModal(false); cargarDatos(); showToast('Empleado asignado', 'success'); }}
          onError={(msg) => showToast(msg, 'error')}
        />
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
    </>
  );
}

export default Proyectos;