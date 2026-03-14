import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';
import ProyectoInfo from '../components/proyecto/ProyectoInfo';
import DocumentosList from '../components/proyecto/DocumentosList';
import EmpleadosList from '../components/proyecto/EmpleadosList';
import ActualizacionesMobile from '../components/proyecto/ActualizacionesMobile';
import Toast from '../components/common/Toast';
import proyectoService from '../services/proyectoService';
import documentoService from '../services/documentoService';
import '../styles/ProyectoCompleto.css';

function ProyectoCompleto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, empleado } = useAuth();

  const [proyecto, setProyecto] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [actualizaciones, setActualizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [toast, setToast] = useState(null);

  const tabs = useMemo(() => ([
    { id: 'info', label: 'Info' },
    { id: 'documentos', label: `Docs (${documentos.length})` },
    { id: 'empleados', label: `Equipo (${empleados.length})` },
    { id: 'avance', label: `Avance (${actualizaciones.length})` }
  ]), [documentos.length, empleados.length, actualizaciones.length]);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);

      try {
        const [pData, eData, dData, aData] = await Promise.all([
          proyectoService.getById(id),
          proyectoService.getEmpleados(id),
          documentoService.getByProyecto(id),
          proyectoService.getActualizaciones(id)
        ]);

        if (!pData.success) {
          navigate('/proyectos');
          return;
        }

        setProyecto(pData.proyecto);
        setEmpleados(eData.empleados || []);
        setDocumentos(dData.documentos || []);
        setActualizaciones(aData.actualizaciones || []);
      } catch {
        navigate('/proyectos');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [id, navigate]);

  const cargarEmpleados = async () => {
    const eData = await proyectoService.getEmpleados(id);
    setEmpleados(eData.empleados || []);
  };

  const cargarDocumentos = async () => {
    const dData = await documentoService.getByProyecto(id);
    setDocumentos(dData.documentos || []);
  };

  const cargarActualizaciones = async () => {
    const aData = await proyectoService.getActualizaciones(id);
    setActualizaciones(aData.actualizaciones || []);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

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
        <section className="project-hero">
          <div className="proyecto-detail-header">
            <button
              className="btn-back btn-back-chip"
              onClick={() => navigate('/proyectos')}
              aria-label="Volver a proyectos"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="proyecto-detail-title">
              <p className="project-kicker">Proyecto</p>
              <h1>{proyecto.nombre}</h1>
            </div>
          </div>
        </section>

        <div className="tabs-bar" role="tablist" aria-label="Secciones del proyecto">
          {tabs.map(({ id: tabId, label }) => (
            <button
              key={tabId}
              className={`tab-btn ${activeTab === tabId ? 'active' : ''}`}
              onClick={() => setActiveTab(tabId)}
              role="tab"
              aria-selected={activeTab === tabId}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'info' && <ProyectoInfo proyecto={proyecto} />}

          {activeTab === 'documentos' && (
            <DocumentosList
              proyectoId={id}
              documentos={documentos}
              empleadosProyecto={empleados}
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

          {activeTab === 'avance' && (
            <ActualizacionesMobile
              proyectoId={id}
              actualizaciones={actualizaciones}
              isAdmin={isAdmin()}
              empleadoId={empleado?.id}
              onReload={cargarActualizaciones}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

export default ProyectoCompleto;
