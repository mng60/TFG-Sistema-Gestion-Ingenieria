import React, { useState } from 'react';
import { Download, Eye, EyeOff, FileText, Upload, Users } from 'lucide-react';
import documentoService from '../../services/documentoService';
import '../../styles/Modal.css';

const fmtTamano = (bytes) => {
  if (!bytes) return '-';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-ES') : '-';

function SubirDocumentoModal({ proyectoId, onClose, onSuccess, showToast }) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    tipo_documento: 'otro',
    nombre: '',
    descripcion: '',
    es_publico: false,
    archivo: null
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('El archivo no puede superar los 10MB', 'error');
      e.target.value = '';
      return;
    }
    setFormData(f => ({ ...f, archivo: file, nombre: f.nombre || file.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.archivo) { showToast('Selecciona un archivo', 'error'); return; }
    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('file', formData.archivo);
      payload.append('proyecto_id', proyectoId);
      payload.append('tipo_documento', formData.tipo_documento);
      payload.append('nombre', formData.nombre);
      payload.append('descripcion', formData.descripcion);
      payload.append('es_publico', formData.es_publico);
      await documentoService.upload(payload);
      onSuccess();
    } catch {
      showToast('Error al subir documento', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !uploading && onClose()}>
      <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Subir Documento</h2>
          <button className="modal-close" onClick={onClose} disabled={uploading}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Archivo *</label>
            <input type="file" onChange={handleFileChange} required disabled={uploading} />
            <small style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Máximo 10MB</small>
          </div>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={e => setFormData(f => ({ ...f, nombre: e.target.value }))}
              required
              disabled={uploading}
              placeholder="Ej: Plano eléctrico principal"
            />
          </div>
          <div className="form-group">
            <label>Tipo *</label>
            <select
              value={formData.tipo_documento}
              onChange={e => setFormData(f => ({ ...f, tipo_documento: e.target.value }))}
              disabled={uploading}
            >
              <option value="esquema">Esquema</option>
              <option value="plano">Plano</option>
              <option value="contrato">Contrato</option>
              <option value="informe">Informe</option>
              <option value="foto">Foto</option>
              <option value="certificado">Certificado</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={formData.es_publico}
                onChange={e => setFormData(f => ({ ...f, es_publico: e.target.checked }))}
                disabled={uploading}
              />
              Visible para el cliente
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={uploading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              <Upload size={15} />
              {uploading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
      await documentoService.setAccesoEmpleados(documento.id, [...seleccionados]);
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
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Acceso de empleados</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <p style={{ fontSize: '0.82rem', color: '#7f8c8d', marginBottom: 14 }}>
            Sin selección → visible para todos los empleados.<br/>
            Con selección → solo los elegidos (y admins) pueden verlo.
          </p>
          {empleadosFiltrados.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: '20px 0' }}>No hay empleados no-admin asignados</p>
          ) : (
            empleadosFiltrados.map(emp => {
              const uid = emp.user_id || emp.id;
              const checked = seleccionados.has(uid);
              return (
                <label key={uid} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 4px', cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(uid)}
                    style={{ width: 18, height: 18, accentColor: '#4DB6A8' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp.empleado_nombre || emp.nombre}</div>
                    <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>{emp.rol_proyecto || emp.rol}</div>
                  </div>
                </label>
              );
            })
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleGuardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentosList({ proyectoId, documentos, empleadosProyecto = [], isAdmin, onReload, showToast }) {
  const [toggling, setToggling] = useState({});
  const [showSubir, setShowSubir] = useState(false);
  const [accesoModal, setAccesoModal] = useState(null);

  const handleDescargar = async (doc) => {
    try {
      await documentoService.descargar(doc);
      showToast('Descargando...', 'success');
    } catch {
      showToast('Error al descargar', 'error');
    }
  };

  const handleTogglePublico = async (doc) => {
    if (toggling[doc.id]) return;
    setToggling((t) => ({ ...t, [doc.id]: true }));
    try {
      await documentoService.togglePublico(doc.id, !doc.es_publico);
      showToast(
        !doc.es_publico ? 'Documento visible para el cliente' : 'Documento ocultado al cliente',
        'success'
      );
      onReload();
    } catch {
      showToast('Error al cambiar visibilidad', 'error');
    } finally {
      setToggling((t) => ({ ...t, [doc.id]: false }));
    }
  };

  return (
    <div>
      <div className="tab-section-header">
        <h3>Documentos ({documentos.length})</h3>
        {isAdmin && (
          <button className="btn-asignar" onClick={() => setShowSubir(true)}>
            <Upload size={14} /> Subir
          </button>
        )}
      </div>

      {documentos.length === 0 ? (
        <div className="empty-state">
          <FileText size={44} color="#ccc" />
          <p>No hay documentos en este proyecto</p>
        </div>
      ) : (
        documentos.map((doc) => (
          <div key={doc.id} className="doc-card">
            <div className="doc-icon">
              <FileText size={28} color="#4DB6A8" />
            </div>
            <div className="doc-info">
              <div className="doc-nombre">{doc.nombre}</div>
              <div className="doc-meta">
                <span className="badge badge-tipo">{doc.tipo_documento}</span>
                <span>{fmtFecha(doc.created_at)}</span>
                <span>{fmtTamano(doc.tamano_bytes)}</span>
              </div>
              {isAdmin && (
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className={`toggle-publico ${doc.es_publico ? 'publico' : 'privado'}`}
                    onClick={() => handleTogglePublico(doc)}
                    disabled={toggling[doc.id]}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    {toggling[doc.id] ? '...' : doc.es_publico
                      ? <><Eye size={11} /> Visible al cliente</>
                      : <><EyeOff size={11} /> Oculto al cliente</>
                    }
                  </button>
                  <button
                    className="toggle-publico"
                    onClick={() => setAccesoModal(doc)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eaf4fb', color: '#2980b9', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    <Users size={11} />
                    {(doc.empleados_acceso_ids || []).length === 0
                      ? 'Todos los empleados'
                      : `${(doc.empleados_acceso_ids || []).length} empleado(s)`
                    }
                  </button>
                </div>
              )}
            </div>
            <div className="doc-actions">
              <button className="btn-icon" onClick={() => handleDescargar(doc)} title="Descargar">
                <Download size={16} color="#4DB6A8" />
              </button>
            </div>
          </div>
        ))
      )}

      {showSubir && (
        <SubirDocumentoModal
          proyectoId={proyectoId}
          onClose={() => setShowSubir(false)}
          onSuccess={() => {
            setShowSubir(false);
            showToast('Documento subido', 'success');
            onReload();
          }}
          showToast={showToast}
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

export default DocumentosList;
