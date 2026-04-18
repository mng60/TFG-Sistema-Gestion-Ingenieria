import React, { useState } from 'react';
import DocumentoModal from './modals/DocumentoModal';
import axios from 'axios';
import { formatearFecha } from '../utils/format';
import { downloadFromUrl } from '../utils/download';
import { Upload, Download, Trash2, Eye, EyeOff, Users } from 'lucide-react';
import '../styles/Modal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AccesoEmpleadosModal({ documento, empleadosProyecto, onClose, onSaved, showToast }) {
  const [seleccionados, setSeleccionados] = useState(new Set(documento.empleados_acceso_ids || []));
  const [saving, setSaving] = useState(false);

  // Excluir admins — siempre tienen acceso
  const empleadosFiltrados = empleadosProyecto.filter(
    emp => emp.empleado_rol !== 'admin' && emp.rol !== 'admin'
  );

  const toggle = (id) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('empleado_token');
      await axios.put(`${API_URL}/documentos/${documento.id}/acceso-empleados`, {
        user_ids: [...seleccionados]
      }, { headers: { 'Authorization': `Bearer ${token}` } });
      showToast('Acceso actualizado', 'success');
      onSaved();
    } catch {
      showToast('Error al actualizar acceso', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>Acceso de empleados</h2>
            <p style={{ fontSize: '0.82rem', margin: '4px 0 0', opacity: 0.85 }}>{documento.nombre}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <p className="modal-description" style={{ fontSize: '0.9rem' }}>
            Sin selección → visible para todos los empleados.<br/>
            Con selección → solo los elegidos (y admins) pueden verlo.
          </p>
          {empleadosFiltrados.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '20px 0' }}>No hay empleados no-admin asignados</p>
          ) : (
            empleadosFiltrados.map(emp => {
              const uid = emp.user_id || emp.id;
              const checked = seleccionados.has(uid);
              return (
                <label key={uid} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: checked ? 'rgba(52,152,219,0.08)' : '#fafafa',
                  border: `2px solid ${checked ? '#3498db' : '#e0e0e0'}`,
                  marginBottom: 8, transition: 'all 0.15s'
                }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(uid)}
                    style={{ width: 16, height: 16, accentColor: '#3498db', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#2c3e50' }}>
                      {emp.empleado_nombre || emp.nombre}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>{emp.rol_proyecto || emp.rol}</div>
                  </div>
                </label>
              );
            })
          )}
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={handleGuardar} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar acceso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProyectoDocumentos({
  proyectoId,
  documentos,
  empleadosProyecto = [],
  isAdmin,
  onReload,
  showToast,
  setConfirmModal
}) {
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [toggling, setToggling] = useState({});
  const [accesoModal, setAccesoModal] = useState(null);

  const formatearTamano = (bytes) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const getIconoTipo = (tipo) => {
    const iconos = {
      esquema: '📐', plano: '📏', contrato: '📜', informe: '📊',
      foto: '📸', certificado: '🏆', otro: '📄'
    };
    return iconos[tipo] || '📄';
  };

  const handleDescargar = async (documento) => {
    try {
      const token = localStorage.getItem('empleado_token');
      const { data } = await axios.get(`${API_URL}/documentos/${documento.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      downloadFromUrl(data.downloadUrl);
    } catch {
      showToast('Error al descargar documento', 'error');
    }
  };

  const handleTogglePublico = async (documento) => {
    if (toggling[documento.id]) return;
    setToggling(t => ({ ...t, [documento.id]: true }));
    try {
      const token = localStorage.getItem('empleado_token');
      await axios.put(`${API_URL}/documentos/${documento.id}`, {
        es_publico: !documento.es_publico
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showToast(
        !documento.es_publico ? 'Documento visible para el cliente' : 'Documento ocultado al cliente',
        'success'
      );
      onReload();
    } catch {
      showToast('Error al cambiar visibilidad', 'error');
    } finally {
      setToggling(t => ({ ...t, [documento.id]: false }));
    }
  };

  const handleEliminar = (documento) => {
    setConfirmModal({
      title: 'Eliminar Documento',
      message: `¿Eliminar el documento "${documento.nombre}"? El archivo se eliminará permanentemente.`,
      type: 'danger',
      confirmText: 'Sí, Eliminar',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('empleado_token');
          await axios.delete(`${API_URL}/documentos/${documento.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          showToast('Documento eliminado', 'success');
          onReload();
        } catch {
          showToast('Error al eliminar documento', 'error');
        }
      }
    });
  };

  return (
    <div className="tab-panel">
      <div className="section-header">
        <h2>Documentos del Proyecto</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowDocumentoModal(true)}>
            <Upload size={16}/> Subir Documento
          </button>
        )}
      </div>

      {documentos.length === 0 ? (
        <p className="empty-message">No hay documentos para este proyecto</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Tamaño</th>
                <th>Visibilidad cliente</th>
                {isAdmin && <th>Acceso empleados</th>}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((documento) => (
                <tr key={documento.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>
                        {getIconoTipo(documento.tipo_documento)}
                      </span>
                      <div>
                        <strong>{documento.nombre}</strong>
                        {documento.descripcion && (
                          <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                            {documento.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-tipo">{documento.tipo_documento}</span>
                  </td>
                  <td>{formatearFecha(documento.created_at)}</td>
                  <td>{formatearTamano(documento.tamano_bytes)}</td>
                  <td>
                    <button
                      onClick={() => handleTogglePublico(documento)}
                      disabled={toggling[documento.id]}
                      className={`badge ${documento.es_publico ? 'badge-publico' : 'badge-privado'}`}
                      style={{
                        border: 'none', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        opacity: toggling[documento.id] ? 0.6 : 1
                      }}
                      title="Haz clic para cambiar visibilidad"
                    >
                      {documento.es_publico
                        ? <><Eye size={13} /> Público</>
                        : <><EyeOff size={13} /> Privado</>
                      }
                    </button>
                  </td>
                  {isAdmin && (
                    <td>
                      <button
                        onClick={() => setAccesoModal(documento)}
                        className="badge"
                        style={{
                          border: 'none', cursor: 'pointer', background: '#eaf4fb', color: '#2980b9',
                          display: 'inline-flex', alignItems: 'center', gap: 4
                        }}
                        title="Gestionar acceso de empleados"
                      >
                        <Users size={13} />
                        {(documento.empleados_acceso_ids || []).length === 0
                          ? 'Todos'
                          : `${(documento.empleados_acceso_ids || []).length} empleado(s)`
                        }
                      </button>
                    </td>
                  )}
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-download"
                        onClick={() => handleDescargar(documento)}
                        title="Descargar"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Download size={14} /> Descargar
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleEliminar(documento)}
                          title="Eliminar"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Trash2 size={14} /> Eliminar
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

      {showDocumentoModal && (
        <DocumentoModal
          proyectoId={proyectoId}
          onClose={() => setShowDocumentoModal(false)}
          onSuccess={() => {
            showToast('Documento subido exitosamente', 'success');
            setShowDocumentoModal(false);
            onReload();
          }}
          onError={(error) => showToast(error, 'error')}
        />
      )}

      {accesoModal && (
        <AccesoEmpleadosModal
          documento={accesoModal}
          empleadosProyecto={empleadosProyecto}
          onClose={() => setAccesoModal(null)}
          onSaved={() => { setAccesoModal(null); onReload(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default ProyectoDocumentos;
