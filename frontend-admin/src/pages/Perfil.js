import React, { useState, useRef } from 'react';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import axios from 'axios';
import { Camera, Save, Lock, User } from 'lucide-react';
import { getAvatarSrc } from '../utils/format';
import '../styles/GestionPages.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Perfil() {
  const { empleado, actualizarEmpleado } = useEmpleadoAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nombre: empleado?.nombre || '',
    telefono: empleado?.telefono || '',
    email_personal: empleado?.email_personal || ''
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [toast, setToast] = useState(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const token = () => localStorage.getItem('empleado_token');

  const handleFotoClick = () => fileInputRef.current?.click();

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const res = await axios.post(`${API_URL}/auth/profile/foto`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token()}` }
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

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return showToast('El nombre es obligatorio', 'error');
    setSavingInfo(true);
    try {
      const res = await axios.put(`${API_URL}/auth/profile`, form, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      actualizarEmpleado(res.data.user);
      showToast('Información actualizada');
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePass = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return showToast('Las contraseñas no coinciden', 'error');
    if (passForm.newPassword.length < 6) return showToast('Mínimo 6 caracteres', 'error');
    setSavingPass(true);
    try {
      await axios.put(`${API_URL}/auth/change-password`,
        { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Contraseña actualizada');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al cambiar contraseña', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const avatarSrc = getAvatarSrc(empleado?.foto_url);

  return (
    <div className="gestion-container perfil-page">
        <div className="gestion-header">
          <h1>Mi Perfil</h1>
        </div>

        {toast && (
          <div style={{
            padding: '12px 20px', borderRadius: 10, marginBottom: 20, fontWeight: 600,
            background: toast.type === 'success' ? '#d4edda' : '#f8d7da',
            color: toast.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${toast.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {toast.msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Foto de perfil */}
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', overflow: 'hidden',
                background: 'linear-gradient(135deg, #4DB6A8, #3A9089)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', color: 'white', fontWeight: 700
              }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (empleado?.nombre || 'U').charAt(0).toUpperCase()
                }
              </div>
              <button
                onClick={handleFotoClick}
                disabled={uploadingFoto}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 36, height: 36, borderRadius: '50%', border: '2px solid white',
                  background: '#4DB6A8', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Cambiar foto"
              >
                <Camera size={16} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0, color: '#e2e8f0' }}>{empleado?.nombre}</p>
              <span style={{
                display: 'inline-block', marginTop: 6, padding: '3px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                background: empleado?.rol === 'admin' ? '#8e44ad' : '#3498db', color: 'white'
              }}>
                {empleado?.rol === 'admin' ? 'Administrador' : 'Empleado'}
              </span>
            </div>
            {uploadingFoto && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Subiendo foto...</p>}
          </div>

          {/* Formularios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Información personal */}
            <div style={{ padding: 28, background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0' }}>
                <User size={18} color="#4DB6A8" /> Información personal
              </h2>
              <form onSubmit={handleSaveInfo}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Ej: +34 600 000 000" />
                  </div>
                  <div className="form-group">
                    <label>Email de acceso</label>
                    <input value={empleado?.email || ''} disabled style={{ background: '#f8f9fa', color: '#7f8c8d' }} />
                  </div>
                  <div className="form-group">
                    <label>Rol</label>
                    <input value={empleado?.rol === 'admin' ? 'Administrador' : 'Empleado'} disabled style={{ background: '#f8f9fa', color: '#7f8c8d' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Email personal (notificaciones) *</label>
                    <input
                      type="email"
                      value={form.email_personal}
                      onChange={e => setForm({ ...form, email_personal: e.target.value })}
                      required
                      placeholder="personal@gmail.com"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={savingInfo} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Save size={16} /> {savingInfo ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </div>

            {/* Cambiar contraseña */}
            <div style={{ padding: 28, background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0' }}>
                <Lock size={18} color="#4DB6A8" /> Cambiar contraseña
              </h2>
              <form onSubmit={handleSavePass}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div className="form-group">
                    <label>Contraseña actual *</label>
                    <input type="password" value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Nueva contraseña *</label>
                    <input type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Confirmar contraseña *</label>
                    <input type="password" value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={savingPass} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={16} /> {savingPass ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
  );
}

export default Perfil;
