import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Award, ClipboardList, Download, FileText, Image, MapPin, Ruler, Scroll, BarChart2, X } from 'lucide-react';
import api from '../services/api';
import { formatearFecha, formatearMoneda, getAvatarInitial, getAvatarSrc } from '../utils/format';
import { downloadFromUrl } from '../utils/download';
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
  const [actualizaciones, setActualizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [toast, setToast] = useState(null);
  const [presupuestoModal, setPresupuestoModal] = useState(null);
  const [rechazarModal, setRechazarModal] = useState(null);
  const [rechazarForm, setRechazarForm] = useState({ motivo: '', sugerirPrecio: false, precio_sugerido: '' });
  const [rechazarSubmitting, setRechazarSubmitting] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [proyectoRes, empleadosRes, presupuestosRes, documentosRes, actualizacionesRes] = await Promise.all([
          api.get('/portal/proyectos'),
          api.get(`/portal/proyectos/${id}/empleados`),
          api.get(`/portal/presupuestos?proyecto_id=${id}`),
          api.get(`/portal/documentos?proyecto_id=${id}`),
          api.get(`/portal/proyectos/${id}/actualizaciones`)
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
        setActualizaciones(actualizacionesRes.data.actualizaciones || []);
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

  const abrirRechazarModal = (presupuesto) => {
    setRechazarForm({ motivo: '', sugerirPrecio: false, precio_sugerido: '' });
    setPresupuestoModal(null);
    setRechazarModal(presupuesto);
  };

  const handleRechazarSubmit = async () => {
    if (!rechazarForm.motivo.trim()) {
      showToast('El motivo del rechazo es obligatorio', 'error');
      return;
    }
    setRechazarSubmitting(true);
    try {
      await api.patch(`/portal/presupuestos/${rechazarModal.id}/rechazar`, {
        motivo: rechazarForm.motivo,
        precio_sugerido: rechazarForm.sugerirPrecio && rechazarForm.precio_sugerido
          ? parseFloat(rechazarForm.precio_sugerido) : null
      });
      showToast('Presupuesto rechazado. El administrador revisará tu solicitud.');
      setRechazarModal(null);
      const res = await api.get(`/portal/presupuestos?proyecto_id=${id}`);
      setPresupuestos(res.data.presupuestos || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al rechazar presupuesto', 'error');
    } finally {
      setRechazarSubmitting(false);
    }
  };

  const descargarDocumento = async (docId) => {
    try {
      const { data } = await api.get(`/portal/documentos/${docId}/download`);
      downloadFromUrl(data.downloadUrl);
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
    <>
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
        <button
          className={`tab ${activeTab === 'avances' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('avances')}
        >
          Avances ({actualizaciones.length})
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
                    </tr>
                  </thead>
                  <tbody>
                    {presupuestos.map((presupuesto) => (
                      <tr
                        key={presupuesto.id}
                        className="tr-pres"
                        onClick={() => setPresupuestoModal(presupuesto)}
                        style={{ cursor: 'pointer' }}
                      >
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'avances' && (
          <div className="tab-panel">
            {actualizaciones.length === 0 ? (
              <p className="empty-message-small">El equipo aún no ha publicado avances para este proyecto.</p>
            ) : (
              <div className="act-list-cliente">
                {actualizaciones.map((act) => (
                  <div key={act.id} className="act-item-cliente">
                    <div className="act-avatar-cliente">
                      {act.autor_foto
                        ? <img src={getAvatarSrc(act.autor_foto)} alt="" />
                        : getAvatarInitial(act.autor_nombre)}
                    </div>
                    <div className="act-body-cliente">
                      <div className="act-meta-cliente">
                        <strong>{act.autor_nombre || 'Equipo BlueArc'}</strong>
                        <span className="act-badge-fecha-cliente">{formatearFecha(act.created_at)}</span>
                      </div>
                      {act.realizado && (
                        <div className="act-bloque-cliente act-bloque-realizado">
                          <span className="act-bloque-label-cliente">Realizado</span>
                          <p>{act.realizado}</p>
                        </div>
                      )}
                      {act.pendiente && (
                        <div className="act-bloque-cliente act-bloque-pendiente">
                          <span className="act-bloque-label-cliente">Próximos pasos</span>
                          <p>{act.pendiente}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
                          <button className="btn-download" onClick={() => descargarDocumento(doc.id)}>
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

    {/* Modales */}
    {/* Modal detalle de presupuesto */}
    {presupuestoModal && (
      <div className="pc-modal-overlay" onClick={() => setPresupuestoModal(null)}>
        <div className="pc-modal" onClick={e => e.stopPropagation()}>
          <div className="pc-modal-header">
            <h3>Detalle del presupuesto</h3>
            <button className="pc-modal-close" onClick={() => setPresupuestoModal(null)}><X size={18} /></button>
          </div>
          <div className="pc-modal-body">
            <div className="pc-modal-grid">
              <div className="pc-modal-field">
                <label>Número</label>
                <p>{presupuestoModal.numero_presupuesto} <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>v{presupuestoModal.version}</span></p>
              </div>
              <div className="pc-modal-field">
                <label>Estado</label>
                <p>
                  <span className={`badge badge-${presupuestoModal.aceptado ? 'aceptado' : presupuestoModal.estado}`}>
                    {presupuestoModal.aceptado ? 'Aceptado' : (presupuestoModal.estado || 'Pendiente')}
                  </span>
                </p>
              </div>
              <div className="pc-modal-field">
                <label>Fecha emisión</label>
                <p>{formatearFecha(presupuestoModal.fecha_emision)}</p>
              </div>
              {presupuestoModal.fecha_validez && (
                <div className="pc-modal-field">
                  <label>Fecha validez</label>
                  <p>{formatearFecha(presupuestoModal.fecha_validez)}</p>
                </div>
              )}
              <div className="pc-modal-field">
                <label>Subtotal</label>
                <p>{formatearMoneda(presupuestoModal.subtotal)}</p>
              </div>
              <div className="pc-modal-field">
                <label>IVA</label>
                <p>{presupuestoModal.iva}%</p>
              </div>
              {presupuestoModal.descripcion && (
                <div className="pc-modal-field full">
                  <label>Descripción</label>
                  <p>{presupuestoModal.descripcion}</p>
                </div>
              )}
              {presupuestoModal.condiciones && (
                <div className="pc-modal-field full">
                  <label>Condiciones</label>
                  <p>{presupuestoModal.condiciones}</p>
                </div>
              )}
            </div>
            <div className="pc-modal-total">
              <span className="pc-modal-total-label">Total presupuestado</span>
              <span className="pc-modal-total-amount">{formatearMoneda(presupuestoModal.total)}</span>
            </div>
            <div className="pc-modal-actions">
              <button className="pc-modal-btn-cancel" onClick={() => setPresupuestoModal(null)}>Cerrar</button>
              {!presupuestoModal.aceptado && presupuestoModal.estado === 'enviado' && (
                <>
                  <button className="btn-reject" onClick={() => abrirRechazarModal(presupuestoModal)}>Rechazar</button>
                  <button className="btn-accept" onClick={() => { aceptarPresupuesto(presupuestoModal.id); setPresupuestoModal(null); }}>Aceptar</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modal rechazo con motivo */}
    {rechazarModal && (
      <div className="pc-modal-overlay" onClick={() => setRechazarModal(null)}>
        <div className="pc-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="pc-modal-header">
            <h3>Rechazar presupuesto</h3>
            <button className="pc-modal-close" onClick={() => setRechazarModal(null)}><X size={18} /></button>
          </div>
          <div className="pc-modal-body">
            <p style={{ color: '#52626a', marginBottom: 18, fontSize: '0.9rem', lineHeight: 1.5 }}>
              Indícanos el motivo. El administrador lo revisará y podrá enviarte una propuesta revisada.
            </p>
            <div className="pc-modal-form-group">
              <label>Motivo del rechazo *</label>
              <textarea
                rows={4}
                value={rechazarForm.motivo}
                onChange={e => setRechazarForm(f => ({ ...f, motivo: e.target.value }))}
                placeholder="Describe el motivo del rechazo..."
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rechazarForm.sugerirPrecio}
                  onChange={e => setRechazarForm(f => ({ ...f, sugerirPrecio: e.target.checked, precio_sugerido: '' }))}
                />
                <span style={{ color: '#374151', fontSize: '0.9rem', fontWeight: 600 }}>Sugerir un precio alternativo</span>
              </label>
            </div>
            {rechazarForm.sugerirPrecio && (
              <div className="pc-modal-form-group">
                <label>Precio sugerido (€)</label>
                <input
                  type="number"
                  value={rechazarForm.precio_sugerido}
                  onChange={e => setRechazarForm(f => ({ ...f, precio_sugerido: e.target.value }))}
                  placeholder="Ej: 1200.00"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
            <div className="pc-modal-actions">
              <button className="pc-modal-btn-cancel" onClick={() => setRechazarModal(null)}>Cancelar</button>
              <button className="btn-reject" onClick={handleRechazarSubmit} disabled={rechazarSubmitting}>
                {rechazarSubmitting ? 'Enviando...' : 'Rechazar presupuesto'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default ProyectoCompleto;
