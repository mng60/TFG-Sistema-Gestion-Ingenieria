import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';
import api from '../services/api';
import { getAvatarInitial } from '../utils/format';
import { Camera, Save, Lock, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/Perfil.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;

function FieldGroup({ label, children }) {
  return (
    <div className="perfil-field">
      <label className="perfil-label">{label}</label>
      {children}
    </div>
  );
}

function Perfil() {
  const { empleado, logout, isAdmin, actualizarEmpleado } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nombre: empleado?.nombre || '',
    telefono: empleado?.telefono || '',
    email_personal: empleado?.email_personal || ''
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const res = await api.post('/auth/profile/foto', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      actualizarEmpleado({ foto_url: res.data.foto_url });
      showToast('Foto actualizada');
    } catch {
      showToast('Error al subir la foto', 'error');
    } finally {
      setUploadingFoto(false);
      e.target.value = '';
    }
  };

  const handleSaveInfo = async () => {
    if (!form.nombre.trim()) return showToast('El nombre es obligatorio', 'error');
    setSavingInfo(true);
    try {
      const res = await api.put('/auth/profile', form);
      actualizarEmpleado(res.data.user);
      showToast('Información actualizada');
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePass = async () => {
    if (passForm.newPassword !== passForm.confirmPassword) return showToast('Las contraseñas no coinciden', 'error');
    if (passForm.newPassword.length < 6) return showToast('Mínimo 6 caracteres', 'error');
    setSavingPass(true);
    try {
      await api.put('/auth/change-password',
        { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword }
      );
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPass(false);
      showToast('Contraseña actualizada');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al cambiar contraseña', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const avatarSrc = empleado?.foto_url ? `${BACKEND_URL}${empleado.foto_url}` : null;

  return (
    <MobileLayout>
      <div className="perfil-page">

        {/* Toast */}
        {toast && (
          <div className={`perfil-toast perfil-toast--${toast.type}`}>
            {toast.msg}
          </div>
        )}

        {/* Avatar + nombre */}
        <div className="perfil-card perfil-card--hero">
          <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 16px' }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg, #4DB6A8, #3A9089)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', color: 'white', fontWeight: 700
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getAvatarInitial(empleado?.nombre, 'U')
              }
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFoto}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 30, height: 30, borderRadius: '50%', border: '2px solid white',
                background: '#4DB6A8', color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <Camera size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px' }}>{empleado?.nombre}</h2>
          <p style={{ color: '#7f8c8d', fontSize: '0.85rem', margin: '0 0 12px' }}>{empleado?.email}</p>
          <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
            background: isAdmin() ? '#8e44ad' : '#3498db', color: 'white'
          }}>
            {isAdmin() ? 'Administrador' : 'Empleado'}
          </span>
          {uploadingFoto && <p style={{ color: '#7f8c8d', fontSize: '0.82rem', marginTop: 8 }}>Subiendo...</p>}
        </div>

        {/* Información personal */}
        <div className="perfil-card">
          <h3 className="perfil-title">Información personal</h3>
          <FieldGroup label="Nombre *">
            <input
              className="perfil-input"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Teléfono">
            <input
              className="perfil-input"
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
              placeholder="+34 600 000 000"
            />
          </FieldGroup>
          <FieldGroup label="Email de acceso">
            <input className="perfil-input perfil-input--disabled" value={empleado?.email || ''} disabled />
          </FieldGroup>
          <FieldGroup label="Email personal (notificaciones) *">
            <input
              className="perfil-input"
              type="email"
              value={form.email_personal}
              onChange={e => setForm({ ...form, email_personal: e.target.value })}
              placeholder="personal@gmail.com"
            />
          </FieldGroup>
          <button onClick={handleSaveInfo} disabled={savingInfo} className="perfil-btn">
            <Save size={16} /> {savingInfo ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* Cambiar contraseña — colapsable */}
        <div className="perfil-card">
          <button onClick={() => setShowPass(!showPass)} className="perfil-pass-toggle">
            <h3 className="perfil-pass-title">
              <Lock size={16} color="#4DB6A8" /> Cambiar contraseña
            </h3>
            {showPass ? <ChevronUp size={18} color="#7f8c8d" /> : <ChevronDown size={18} color="#7f8c8d" />}
          </button>

          {showPass && (
            <div style={{ marginTop: 16 }}>
              <FieldGroup label="Contraseña actual *">
                <input className="perfil-input" type="password" value={passForm.currentPassword}
                  onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Nueva contraseña *">
                <input className="perfil-input" type="password" value={passForm.newPassword}
                  onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </FieldGroup>
              <FieldGroup label="Confirmar contraseña *">
                <input className="perfil-input" type="password" value={passForm.confirmPassword}
                  onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} />
              </FieldGroup>
              <button onClick={handleSavePass} disabled={savingPass} className="perfil-btn">
                <Lock size={16} /> {savingPass ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          )}
        </div>

        {/* Nota admin */}
        {isAdmin() && (
          <div className="perfil-admin-note">
            💡 Para gestión completa usa el portal web de administración.
          </div>
        )}

        {/* Cerrar sesión */}
        <button onClick={handleLogout} className="perfil-btn-logout">
          <LogOut size={18} /> Cerrar Sesión
        </button>

      </div>
    </MobileLayout>
  );
}

export default Perfil;
