import React, { useState, useEffect } from 'react';
import { BriefcaseBusiness, CircleHelp, UserRound, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/SolicitarProyecto.css';
import api from '../services/api';
import { formatearFecha } from '../utils/format';

const TIPO_PROYECTO_OPTIONS = [
  { value: 'fotovoltaica', label: 'Instalacion fotovoltaica' },
  { value: 'reforma-electrica', label: 'Reforma electrica' },
  { value: 'instalacion-industrial', label: 'Instalacion industrial' },
  { value: 'legalizacion', label: 'Legalizacion y tramites' },
  { value: 'mantenimiento', label: 'Mantenimiento o mejora' },
  { value: 'cargadores', label: 'Puntos de recarga' },
  { value: 'otro', label: 'Otro' }
];

function SolicitarProyecto() {
  const { cliente } = useAuth();
  const [formSent, setFormSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    tipoProyecto: '',
    ubicacion: '',
    mensaje: ''
  });
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    api.get('/portal/tickets')
      .then((res) => setSolicitudes((res.data.tickets || []).filter(t => t.tipo === 'solicitud_nuevo_proyecto')))
      .catch(() => {});
  }, [formSent]);

  const nombreContacto = cliente?.persona_contacto || cliente?.nombre_empresa || 'Cliente portal';
  const empresa = cliente?.nombre_empresa || '';

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tipoProyecto || !formData.mensaje) {
      setFormError('Completa al menos el tipo de proyecto y la descripcion.');
      return;
    }

    setSending(true);
    setFormError('');

    try {
      const payload = {
        tipoProyecto: TIPO_PROYECTO_OPTIONS.find((option) => option.value === formData.tipoProyecto)?.label || formData.tipoProyecto,
        ubicacion: formData.ubicacion,
        mensaje: formData.mensaje
      };

      const data = await api.post('/portal/tickets', payload);
      if (!data.data) throw new Error('Error al enviar');

      setFormSent(true);
    } catch (err) {
      setFormError(err.message || 'Error al enviar la solicitud. Intentalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="solicitud-page">
      <div className="proyecto-header solicitud-header-card">
        <div className="proyecto-header-info">
          <h1>Solicitar Proyecto</h1>
          <p className="solicitud-header-copy">
            Cuentanos que necesitas y preparamos una propuesta inicial para tu proyecto.
          </p>
        </div>
      </div>

      {solicitudes.length > 0 && (
        <div className="solicitud-grid" style={{ marginBottom: 24 }}>
          <section className="solicitud-card solicitud-card--form solicitud-card--full">
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1B3A4B', fontWeight: 700 }}>
              Mis solicitudes anteriores
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {solicitudes.map((sol) => (
                <div
                  key={sol.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid #dbe4ea',
                    background: '#f8fbfc',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    {sol.estado === 'resuelto'
                      ? <CheckCircle2 size={18} color="#27ae60" />
                      : <Clock size={18} color="#e67e22" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: sol.estado === 'resuelto' ? '#eafaf1' : '#fef6ec',
                        color: sol.estado === 'resuelto' ? '#1e8449' : '#b7590a'
                      }}>
                        {sol.estado === 'resuelto' ? 'Atendida' : 'Pendiente'}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#8fa0aa' }}>
                        {formatearFecha(sol.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#52626a', fontSize: '0.92rem', lineHeight: 1.5 }}>
                      {sol.mensaje.length > 180 ? sol.mensaje.slice(0, 180) + '…' : sol.mensaje}
                    </p>
                    {sol.estado === 'resuelto' && sol.resuelto_at && (
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#27ae60' }}>
                        Atendida el {formatearFecha(sol.resuelto_at)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="solicitud-grid">
        <section className="solicitud-card solicitud-card--form solicitud-card--full">
          {formSent ? (
            <div className="solicitud-success">
              <div className="solicitud-success-icon">
                <BriefcaseBusiness size={24} />
              </div>
              <h3>Solicitud enviada</h3>
              <p>Hemos recibido tu proyecto y contactaremos contigo en breve.</p>
            </div>
          ) : (
            <form className="solicitud-form" onSubmit={handleSubmit}>
              <div className="solicitud-profile-note">
                <div className="solicitud-profile-icon">
                  <UserRound size={18} />
                </div>
                <div>
                  <strong>Usaremos tus datos del portal</strong>
                  <p>
                    La solicitud se enviara con los datos de contacto de <span>{nombreContacto}</span>
                    {empresa ? ` (${empresa})` : ''}.
                  </p>
                </div>
              </div>

              {formError && <div className="solicitud-error">{formError}</div>}

              <div className="solicitud-row solicitud-row--compact">
                <div className="solicitud-group">
                  <label>Tipo de proyecto *</label>
                  <select
                    value={formData.tipoProyecto}
                    onChange={(e) => updateField('tipoProyecto', e.target.value)}
                    required
                  >
                    <option value="">Selecciona un tipo</option>
                    {TIPO_PROYECTO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="solicitud-group">
                  <label>Ubicacion</label>
                  <input
                    type="text"
                    placeholder="Ciudad o direccion de referencia"
                    value={formData.ubicacion}
                    onChange={(e) => updateField('ubicacion', e.target.value)}
                  />
                </div>
              </div>

              <div className="solicitud-group">
                <label>Descripcion *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Describe el proyecto, alcance esperado, plazos y cualquier informacion que debamos tener en cuenta."
                  value={formData.mensaje}
                  onChange={(e) => updateField('mensaje', e.target.value)}
                />
              </div>

              <div className="solicitud-help">
                <CircleHelp size={16} />
                <span>Si necesitas actualizar tu email o telefono, puedes hacerlo desde tu perfil antes de enviar la solicitud.</span>
              </div>

              <button type="submit" className="solicitud-submit" disabled={sending}>
                {sending ? 'Enviando...' : 'Solicitar proyecto'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export default SolicitarProyecto;
