import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Award, ClipboardList, Download, FileText, Image, MapPin, Ruler, Scroll, BarChart2 } from 'lucide-react';
import api from '../services/api';
import { formatearFecha, formatearMoneda, getAvatarInitial, getAvatarSrc } from '../utils/format';
import Toast from '../components/Toast';
import '../styles/ProyectoCompleto.css';

const TIPO_DOC_ICONS = {
  esquema: <Ruler size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  plano: <ClipboardList size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  contrato: <Scroll size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  informe: <BarChart2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  foto: <Image size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  certificado: <Award size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />,
  otro: <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
};

function ProyectoCompleto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proyecto, setProyecto] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [proyectoRes, empleadosRes, presupuestosRes, documentosRes] = await Promise.all([
          api.get('/portal/proyectos'),
          api.get(`/portal/proyectos/${id}/empleados`),
          api.get(`/portal/presupuestos?proyecto_id=${id}`),
          api.get(`/portal/documentos?proyecto_id=${id}`)
        ]);

        const proyectoEncontrado = (proyectoRes.data.proyectos || []).find((p) => String(p.id) === String(id));
        if (!proyectoEncontrado) {
          navigate('/dashboard');
          return;
        }

        setProyecto(proyectoEncontrado);
        setEmpleados(empleadosRes.data.empleados || []);
        setPresupuestos(presupuestosRes.data.presupuestos || []);
        setDocumentos(documentosRes.data.documentos || []);
      } catch (error) {
        console.error('Error al cargar proyecto:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, navigate]);

  const showToast = (msg, tipo = 'success') => {
    setToast({ message: msg, type: tipo });
  };

  const aceptarPresupuesto = async (presupuestoId) => {
    if (!window.confirm('¿Confirmas que deseas aceptar este presupuesto?')) return;
    try {
      await api.patch(`/portal/presupuestos/${presupuestoId}/aceptar`);
      showToast('Presupuesto aceptado exitosamente');
      const res = await api.get(`/portal/presupuestos?proyecto_id=${id}`);
      setPresupuestos(res.data.presupuestos || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al aceptar presupuesto', 'error');
    }
  };

  const rechazarPresupuesto = async (presupuestoId) => {
    if (!window.confirm('¿Confirmas que deseas rechazar este presupuesto?')) return;
    try {
      await api.patch(`/portal/presupuestos/${presupuestoId}/rechazar`);
      showToast('Presupuesto rechazado');
      const res = await api.get(`/portal/presupuestos?proyecto_id=${id}`);
      setPresupuestos(res.data.presupuestos || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al rechazar presupuesto', 'error');
    }
  };

  const descargarDocumento = async (docId, nombre) => {
    try {
      const response = await api.get(`/portal/documentos/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombre);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      showToast('Error al descargar el documento', 'error');
    }
  };

  const irAlChatProyecto = () => {
    navigate('/chat', { state: { proyectoId: proyecto.id } });
  };


  const formatearTamano = (bytes) => {
    if (!bytes) return '-';
    return bytes > 1048576
      ? `${(bytes / 1048576).toFixed(2)} MB`
      : `${(bytes / 1024).toFixed(2)} KB`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Cargando proyecto...</p>
      </div>
    );
  }

  if (!proyecto) return null;

  return (
    <div className="proyecto-completo">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="proyecto-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Volver</button>
        <div className="proyecto-header-info">
          <h1>{proyecto.nombre}</h1>
        </div>
        <button className="chat-proyecto-btn" onClick={irAlChatProyecto}>
          Ir al chat del proyecto
        </button>
      </header>

      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Información
        </button>
        <button
          className={`tab ${activeTab === 'presupuestos' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('presupuestos')}
        >
          Presupuestos ({presupuestos.length})
        </button>
        <button
          className={`tab ${activeTab === 'documentos' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          Documentos ({documentos.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="tab-panel">
            <section className="info-section">
              <h2>Información General</h2>
              <div className="info-grid">
                {proyecto.ubicacion && (
                  <div className="info-item info-item-full">
                    <label><MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 3 }} />Ubicación:</label>
                    <span>{proyecto.ubicacion}</span>
                  </div>
                )}
                <div className="info-item">
                  <label>Fecha Inicio:</label>
                  <span>{formatearFecha(proyecto.fecha_inicio)}</span>
                </div>
                {proyecto.fecha_fin_estimada && (
                  <div className="info-item">
                    <label>Fin Estimado:</label>
                    <span>{formatearFecha(proyecto.fecha_fin_estimada)}</span>
                  </div>
                )}
                {proyecto.fecha_fin_real && (
                  <div className="info-item">
                    <label>Fin Real:</label>
                    <span>{formatearFecha(proyecto.fecha_fin_real)}</span>
                  </div>
                )}
                {proyecto.presupuesto_estimado && (
                  <div className="info-item">
                    <label>Presupuesto Estimado:</label>
                    <span>{formatearMoneda(proyecto.presupuesto_estimado)}</span>
                  </div>
                )}
              </div>
            </section>

            {proyecto.descripcion && (
              <section className="info-section">
                <h2>Descripción</h2>
                <p className="info-descripcion">{proyecto.descripcion}</p>
              </section>
            )}

            {empleados.length > 0 && (
              <section className="info-section">
                <h2>Equipo Asignado</h2>
                <div className="empleados-grid">
                  {empleados.map((emp) => (
                    <div key={emp.id} className="empleado-card">
                      <div className="empleado-avatar">
                        {getAvatarSrc(emp.foto_url)
                          ? <img src={getAvatarSrc(emp.foto_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : getAvatarInitial(emp.nombre)
                        }
                      </div>
                      <div className="empleado-info">
                        <strong>{emp.nombre}</strong>
                        <span className="empleado-rol">{emp.rol_proyecto || emp.rol}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'presupuestos' && (
          <div className="tab-panel">
            {presupuestos.length === 0 ? (
              <p className="empty-message-small">No hay presupuestos para este proyecto.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Fecha emisión</th>
                      <th>Subtotal</th>
                      <th>IVA</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presupuestos.map((presupuesto) => (
                      <tr key={presupuesto.id}>
                        <td><strong>{presupuesto.numero_presupuesto}</strong></td>
                        <td>{formatearFecha(presupuesto.fecha_emision)}</td>
                        <td>{formatearMoneda(presupuesto.subtotal)}</td>
                        <td>{presupuesto.iva}%</td>
                        <td><strong>{formatearMoneda(presupuesto.total)}</strong></td>
                        <td>
                          <span className={`badge badge-${presupuesto.aceptado ? 'aceptado' : presupuesto.estado}`}>
                            {presupuesto.aceptado ? 'Aceptado' : (presupuesto.estado || 'Pendiente')}
                          </span>
                        </td>
                        <td>
                          {!presupuesto.aceptado && presupuesto.estado === 'enviado' && presupuesto.estado !== 'rechazado' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn-accept" onClick={() => aceptarPresupuesto(presupuesto.id)}>
                                Aceptar
                              </button>
                              <button className="btn-reject" onClick={() => rechazarPresupuesto(presupuesto.id)}>
                                Rechazar
                              </button>
                            </div>
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

        {activeTab === 'documentos' && (
          <div className="tab-panel">
            {documentos.length === 0 ? (
              <p className="empty-message-small">No hay documentos disponibles para este proyecto.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Tamaño</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <span>{TIPO_DOC_ICONS[doc.tipo_documento] || TIPO_DOC_ICONS.otro} {doc.nombre}</span>
                        </td>
                        <td><span className="badge badge-tipo">{doc.tipo_documento}</span></td>
                        <td>{formatearFecha(doc.created_at)}</td>
                        <td>{formatearTamano(doc.tamano_bytes)}</td>
                        <td>
                          <button className="btn-download" onClick={() => descargarDocumento(doc.id, doc.nombre)}>
                            <Download size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Descargar
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

export default ProyectoCompleto;
