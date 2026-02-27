import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/ProyectoCompleto.css';

const ESTADO_LABELS = {
  planificacion: 'Planificación',
  en_progreso: 'En progreso',
  pausado: 'Pausado',
  completado: 'Completado',
  cancelado: 'Cancelado'
};

const TIPO_DOC_ICONS = {
  esquema: '📐', plano: '📋', contrato: '📜',
  informe: '📊', foto: '🖼️', certificado: '🏅', otro: '📄'
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

  useEffect(() => { cargarDatos(); }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [proyectoRes, empleadosRes, presupuestosRes, documentosRes] = await Promise.all([
        api.get('/portal/proyectos'),
        api.get(`/portal/proyectos/${id}/empleados`),
        api.get(`/portal/presupuestos?proyecto_id=${id}`),
        api.get(`/portal/documentos?proyecto_id=${id}`)
      ]);
      const proyectoEncontrado = (proyectoRes.data.proyectos || []).find(p => String(p.id) === String(id));
      if (!proyectoEncontrado) { navigate('/dashboard'); return; }
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

  const showToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
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
    } catch (error) {
      showToast('Error al descargar el documento', 'error');
    }
  };

  const formatearFecha = (f) => f ? new Date(f).toLocaleDateString('es-ES') : '-';
  const formatearMoneda = (v) => v
    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v)
    : '0,00 €';
  const formatearTamano = (bytes) => {
    if (!bytes) return '-';
    return bytes > 1048576
      ? `${(bytes / 1048576).toFixed(2)} MB`
      : `${(bytes / 1024).toFixed(2)} KB`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando proyecto...</p>
      </div>
    );
  }

  if (!proyecto) return null;

  return (
    <div className="proyecto-completo">
      {/* Toast */}
      {toast && <div className={`toast toast-${toast.tipo}`}>{toast.msg}</div>}

      {/* Cabecera */}
      <header className="proyecto-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Volver</button>
        <div className="proyecto-header-info">
          <h1>{proyecto.nombre}</h1>
          <div className="proyecto-badges">
            <span className={`badge badge-${proyecto.estado}`}>
              {ESTADO_LABELS[proyecto.estado] || proyecto.estado}
            </span>
          </div>
        </div>
        <button className="chat-proyecto-btn" onClick={() => navigate('/chat')}>
          💬 Ir al chat
        </button>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          📋 Información
        </button>
        <button
          className={`tab ${activeTab === 'presupuestos' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('presupuestos')}
        >
          💰 Presupuestos ({presupuestos.length})
        </button>
        <button
          className={`tab ${activeTab === 'documentos' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('documentos')}
        >
          📄 Documentos ({documentos.length})
        </button>
      </div>

      <div className="tab-content">

        {/* ── TAB INFORMACIÓN ── */}
        {activeTab === 'info' && (
          <div className="tab-panel">
            <section className="info-section">
              <h2>Información General</h2>
              <div className="info-grid">
                {proyecto.ubicacion && (
                  <div className="info-item info-item-full">
                    <label>📍 Ubicación:</label>
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
                  {empleados.map(emp => (
                    <div key={emp.id} className="empleado-card">
                      <div className="empleado-avatar">
                        {emp.nombre.charAt(0).toUpperCase()}
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

        {/* ── TAB PRESUPUESTOS ── */}
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
                    {presupuestos.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.numero_presupuesto}</strong></td>
                        <td>{formatearFecha(p.fecha_emision)}</td>
                        <td>{formatearMoneda(p.subtotal)}</td>
                        <td>{p.iva}%</td>
                        <td><strong>{formatearMoneda(p.total)}</strong></td>
                        <td>
                          <span className={`badge badge-${p.aceptado ? 'aceptado' : p.estado}`}>
                            {p.aceptado ? 'Aceptado' : (p.estado || 'Pendiente')}
                          </span>
                        </td>
                        <td>
                          {!p.aceptado && p.estado === 'enviado' && (
                            <button className="btn-accept" onClick={() => aceptarPresupuesto(p.id)}>
                              Aceptar
                            </button>
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

        {/* ── TAB DOCUMENTOS ── */}
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
                    {documentos.map(doc => (
                      <tr key={doc.id}>
                        <td>
                          <span>{TIPO_DOC_ICONS[doc.tipo_documento] || '📄'} {doc.nombre}</span>
                        </td>
                        <td><span className="badge badge-tipo">{doc.tipo_documento}</span></td>
                        <td>{formatearFecha(doc.created_at)}</td>
                        <td>{formatearTamano(doc.tamano_bytes)}</td>
                        <td>
                          <button
                            className="btn-download"
                            onClick={() => descargarDocumento(doc.id, doc.nombre)}
                          >
                            ⬇️ Descargar
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
