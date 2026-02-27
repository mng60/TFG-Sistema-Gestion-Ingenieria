import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';
import ProyectoInfo from '../components/proyecto/ProyectoInfo';
import DocumentosList from '../components/proyecto/DocumentosList';
import EmpleadosList from '../components/proyecto/EmpleadosList';
import Toast from '../components/common/Toast';
import proyectoService from '../services/proyectoService';
import documentoService from '../services/documentoService';
import '../styles/ProyectoCompleto.css';

const TABS = [
  { id: 'info', label: '📋 Info' },
  { id: 'documentos', label: '📄 Docs' },
  { id: 'empleados', label: '👥 Equipo' }
];

function ProyectoCompleto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [proyecto, setProyecto] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [toast, setToast] = useState(null);

  useEffect(() => { cargar(); }, [id]);

  const cargar = async () => {
    setLoading(true);
    try {
      const [pData, eData, dData] = await Promise.all([
        proyectoService.getById(id),
        proyectoService.getEmpleados(id),
        documentoService.getByProyecto(id)
      ]);
      if (!pData.success) { navigate('/proyectos'); return; }
      setProyecto(pData.proyecto);
      setEmpleados(eData.empleados || []);
      setDocumentos(dData.documentos || []);
    } catch {
      navigate('/proyectos');
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    const eData = await proyectoService.getEmpleados(id);
    setEmpleados(eData.empleados || []);
  };

  const cargarDocumentos = async () => {
    const dData = await documentoService.getByProyecto(id);
    setDocumentos(dData.documentos || []);
  };

  const showToast = (message, type = 'success') => setToast({ message, type });

  if (loading) {
    return (
      <MobileLayout>
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="spinner" />
          <span>Cargando proyecto...</span>
        </div>
      </MobileLayout>
    );
  }

  if (!proyecto) return null;

  return (
    <MobileLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="proyecto-detail">
        <div className="proyecto-detail-header">
          <button className="btn-back" onClick={() => navigate('/proyectos')}>←</button>
          <div className="proyecto-detail-title">
            <h1>{proyecto.nombre}</h1>
            <div className="proyecto-detail-badges">
              <span className={`badge badge-${proyecto.estado}`}>
                {proyecto.estado?.replace('_', ' ')}
              </span>
              <span className={`badge badge-${proyecto.prioridad}`}>{proyecto.prioridad}</span>
            </div>
          </div>
        </div>

        <div className="tabs-bar">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {t.id === 'documentos' && ` (${documentos.length})`}
              {t.id === 'empleados' && ` (${empleados.length})`}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'info' && <ProyectoInfo proyecto={proyecto} />}

          {activeTab === 'documentos' && (
            <DocumentosList
              documentos={documentos}
              isAdmin={isAdmin()}
              onReload={cargarDocumentos}
              showToast={showToast}
            />
          )}

          {activeTab === 'empleados' && (
            <EmpleadosList
              proyectoId={id}
              empleados={empleados}
              isAdmin={isAdmin()}
              onReload={cargarEmpleados}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

export default ProyectoCompleto;
