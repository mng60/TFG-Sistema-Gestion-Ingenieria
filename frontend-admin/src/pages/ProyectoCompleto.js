import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import AdminLayout from '../components/Layout/AdminLayout';
import proyectoService from '../services/proyectoService';
import presupuestoService from '../services/presupuestoService';
import clienteService from '../services/clienteService';
import usuarioService from '../services/usuarioService';
import Toast from '../components/Toast';
import axios from 'axios';
import ConfirmModal from '../components/ConfirmModal';
import ProyectoInfo from '../components/ProyectoInfo';
import ProyectoPresupuestos from '../components/ProyectoPresupuestos';
import ProyectoDocumentos from '../components/ProyectoDocumentos';
import '../styles/ProyectoCompleto.css';

function ProyectoCompleto() {
  const { id } = useParams();
  const { isAdmin } = useEmpleadoAuth();
  const navigate = useNavigate();

  // Estados principales
  const [proyecto, setProyecto] = useState(null);
  const [empleadosProyecto, setEmpleadosProyecto] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  
  // Estados de UI
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    document.title = `Proyecto - ${proyecto?.nombre || 'Cargando...'}`;
    cargarProyectoCompleto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarProyectoCompleto = async () => {
    setLoading(true);
    try {
      const requests = [
        proyectoService.getById(id),
        clienteService.getAll({ activo: true })
      ];

      if (isAdmin()) {
        requests.push(usuarioService.getAll());
      }

      const results = await Promise.all(requests);

      const proyectoData = results[0];
      const clientesData = results[1];
      const usuariosData = isAdmin() ? results[2] : { users: [] };

      if (!proyectoData.success) {
        showToast('Proyecto no encontrado', 'error');
        navigate('/proyectos');
        return;
      }

      setProyecto(proyectoData.proyecto);
      setClientes(clientesData.clientes || []);
      setUsuarios(usuariosData.users || []);

      await Promise.all([
        cargarEmpleados(),
        cargarPresupuestos(),
        cargarDocumentos()
      ]);
    } catch (error) {
      console.error('Error al cargar proyecto:', error);
      showToast('Error al cargar proyecto', 'error');
      navigate('/proyectos');
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      const data = await proyectoService.getEmpleados(id);
      setEmpleadosProyecto(data.empleados || []);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const cargarPresupuestos = async () => {
    try {
      const data = await presupuestoService.getByProyecto(id);
      setPresupuestos(data.presupuestos || []);
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
    }
  };

  const cargarDocumentos = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');

      const response = await axios.get(`${API_URL}/documentos?proyecto_id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setDocumentos(response.data.documentos || []);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando proyecto...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!proyecto) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <p>Proyecto no encontrado</p>
          <button className="btn-primary" onClick={() => navigate('/proyectos')}>
            Volver a Proyectos
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="proyecto-header">
        <button className="btn-back" onClick={() => navigate('/proyectos')}>← Volver</button>
        <div className="proyecto-header-info">
          <h1>{proyecto.nombre}</h1>
          <div className="proyecto-badges">
            <span className={`badge badge-${proyecto.estado}`}>{proyecto.estado.replace('_', ' ')}</span>
            <span className={`badge badge-${proyecto.prioridad}`}>{proyecto.prioridad}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`} onClick={() => setActiveTab('info')}>
          📋 Información
        </button>
        <button className={`tab ${activeTab === 'presupuestos' ? 'tab-active' : ''}`} onClick={() => setActiveTab('presupuestos')}>
          💰 Presupuestos ({presupuestos.length})
        </button>
        <button className={`tab ${activeTab === 'documentos' ? 'tab-active' : ''}`} onClick={() => setActiveTab('documentos')}>
          📄 Documentos ({documentos.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'info' && (
          <ProyectoInfo
            proyecto={proyecto}
            empleadosProyecto={empleadosProyecto}
            clientes={clientes}
            usuarios={usuarios}
            isAdmin={isAdmin()}
            onReload={cargarProyectoCompleto}
            onReloadEmpleados={cargarEmpleados}
            showToast={showToast}
            setConfirmModal={setConfirmModal}
          />
        )}

        {activeTab === 'presupuestos' && (
          <ProyectoPresupuestos
            proyectoId={id}
            proyecto={proyecto}
            presupuestos={presupuestos}
            isAdmin={isAdmin()}
            onReload={cargarPresupuestos}
            showToast={showToast}
            setConfirmModal={setConfirmModal}
          />
        )}

        {activeTab === 'documentos' && (
          <ProyectoDocumentos
            proyectoId={id}
            documentos={documentos}
            isAdmin={isAdmin()}
            onReload={cargarDocumentos}
            showToast={showToast}
            setConfirmModal={setConfirmModal}
          />
        )}
      </div>

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

export default ProyectoCompleto;