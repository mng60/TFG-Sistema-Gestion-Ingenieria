import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';
import axios from 'axios';
import { Camera, Save, Lock, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;

const card = {
  background: 'white', borderRadius: 16, padding: '20px',
  marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
};

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0',
  fontSize: '0.95rem', fontFamily: 'inherit', boxSizing: 'border-box',
  outline: 'none', background: 'white'
};

const inputDisabled = { ...inputStyle, background: '#f8f9fa', color: '#7f8c8d' };

const labelStyle = {
  fontSize: '0.75rem', fontWeight: 600, color: '#7f8c8d',
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5, display: 'block'
};

function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
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
    telefono: empleado?.telefono || ''
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

  const token = localStorage.getItem('empleado_token');

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const res = await axios.post(`${API_URL}/auth/profile/foto`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
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
      const res = await axios.put(`${API_URL}/auth/profile`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      await axios.put(`${API_URL}/auth/change-password`,
        { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
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
      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>

        {/* Toast */}
        {toast && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 14, fontWeight: 600, fontSize: '0.9rem',
            background: toast.type === 'success' ? '#d4edda' : '#f8d7da',
            color: toast.type === 'success' ? '#155724' : '#721c24'
          }}>
            {toast.msg}
          </div>
        )}

        {/* Avatar + nombre */}
        <div style={{ ...card, textAlign: 'center', paddingTop: 28, paddingBottom: 24 }}>
          <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 16px' }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg, #4DB6A8, #3A9089)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.2rem', color: 'white', fontWeight: 700
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (empleado?.nombre || 'U').charAt(0).toUpperCase()
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
        <div style={card}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, color: '#2c3e50' }}>
            Información personal
          </h3>
          <FieldGroup label="Nombre *">
            <input
              style={inputStyle}
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="Teléfono">
            <input
              style={inputStyle}
              value={form.telefono}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
              placeholder="+34 600 000 000"
            />
          </FieldGroup>
          <FieldGroup label="Email">
            <input style={inputDisabled} value={empleado?.email || ''} disabled />
          </FieldGroup>
          <button
            onClick={handleSaveInfo}
            disabled={savingInfo}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #4DB6A8, #3A9089)',
              color: 'white', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: savingInfo ? 0.7 : 1
            }}
          >
            <Save size={16} /> {savingInfo ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* Cambiar contraseña — colapsable */}
        <div style={card}>
          <button
            onClick={() => setShowPass(!showPass)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={16} color="#4DB6A8" /> Cambiar contraseña
            </h3>
            {showPass ? <ChevronUp size={18} color="#7f8c8d" /> : <ChevronDown size={18} color="#7f8c8d" />}
          </button>

          {showPass && (
            <div style={{ marginTop: 16 }}>
              <FieldGroup label="Contraseña actual *">
                <input style={inputStyle} type="password" value={passForm.currentPassword}
                  onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Nueva contraseña *">
                <input style={inputStyle} type="password" value={passForm.newPassword}
                  onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </FieldGroup>
              <FieldGroup label="Confirmar contraseña *">
                <input style={inputStyle} type="password" value={passForm.confirmPassword}
                  onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} />
              </FieldGroup>
              <button
                onClick={handleSavePass}
                disabled={savingPass}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #4DB6A8, #3A9089)',
                  color: 'white', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: savingPass ? 0.7 : 1
                }}
              >
                <Lock size={16} /> {savingPass ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          )}
        </div>

        {/* Nota admin */}
        {isAdmin() && (
          <div style={{
            background: '#f0f4ff', borderRadius: 12, padding: '12px 16px',
            marginBottom: 12, fontSize: '0.82rem', color: '#3498db',
            border: '1px solid #dbeafe'
          }}>
            💡 Para gestión completa usa el portal web de administración.
          </div>
        )}

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '14px', background: '#fee2e2',
            color: '#dc2626', border: 'none', borderRadius: 12,
            fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          <LogOut size={18} /> Cerrar Sesión
        </button>

      </div>
    </MobileLayout>
  );
}

export default Perfil;
