import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Camera, Save, Lock, Building2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const card = {
  background: 'white', borderRadius: 16, padding: 28,
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0'
};

const fg = { display: 'flex', flexDirection: 'column', gap: 6 };

const labelSt = { fontSize: '0.78rem', fontWeight: 600, color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.04em' };

const inputSt = {
  padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8,
  fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none'
};

const inputDisabled = { ...inputSt, background: '#f8f9fa', color: '#aaa' };

const btnPrimary = {
  background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: 'white',
  border: 'none', padding: '11px 22px', borderRadius: 10, fontWeight: 600,
  fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
};

function FG({ label, children }) {
  return <div style={fg}><label style={labelSt}>{label}</label>{children}</div>;
}

function Perfil() {
  const { cliente, actualizarCliente } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    persona_contacto: cliente?.persona_contacto || '',
    telefono: cliente?.telefono || '',
    telefono_contacto: cliente?.telefono_contacto || '',
    email_personal: cliente?.email_personal || '',
    direccion: cliente?.direccion || '',
    ciudad: cliente?.ciudad || '',
    codigo_postal: cliente?.codigo_postal || '',
    provincia: cliente?.provincia || '',
    pais: cliente?.pais || ''
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

  const token = () => localStorage.getItem('token');

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const res = await axios.post(`${API_URL}/portal/perfil/foto`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token()}` }
      });
      actualizarCliente({ foto_url: res.data.foto_url });
      showToast('Logo actualizado');
    } catch {
      showToast('Error al subir la imagen', 'error');
    } finally {
      setUploadingFoto(false);
      e.target.value = '';
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await axios.put(`${API_URL}/portal/perfil`, form, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      actualizarCliente(res.data.cliente);
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
      await axios.put(`${API_URL}/portal/cambiar-password`,
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

  const avatarSrc = cliente?.foto_url ? `${BACKEND_URL}${cliente.foto_url}` : null;

  return (
    <div style={{ padding: '30px 24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2c3e50', margin: 0 }}>Mi Perfil</h1>
        <p style={{ color: '#7f8c8d', margin: '4px 0 0' }}>{cliente?.email}</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Logo / foto */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32 }}>
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3rem', color: 'white', fontWeight: 700
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (cliente?.nombre_empresa || 'C').charAt(0).toUpperCase()
              }
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFoto}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 36, height: 36, borderRadius: '50%', border: '2px solid white',
                background: '#27ae60', color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Cambiar logo"
            >
              <Camera size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{cliente?.nombre_empresa}</p>
          </div>
          {uploadingFoto && <p style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Subiendo imagen...</p>}
        </div>

        {/* Formularios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Información de empresa */}
          <div style={card}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#2c3e50' }}>
              <Building2 size={18} color="#27ae60" /> Información de empresa
            </h2>
            <form onSubmit={handleSaveInfo}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <FG label="Empresa">
                  <input style={inputDisabled} value={cliente?.nombre_empresa || ''} disabled />
                </FG>
                <FG label="CIF">
                  <input style={inputDisabled} value={cliente?.cif || ''} disabled />
                </FG>
                <FG label="Email">
                  <input style={inputDisabled} value={cliente?.email || ''} disabled />
                </FG>
                <FG label="Persona de contacto">
                  <input style={inputSt} value={form.persona_contacto} onChange={e => setForm({ ...form, persona_contacto: e.target.value })} placeholder="Nombre del responsable" />
                </FG>
                <FG label="Teléfono empresa">
                  <input style={inputSt} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+34 900 000 000" />
                </FG>
                <FG label="Teléfono contacto">
                  <input style={inputSt} value={form.telefono_contacto} onChange={e => setForm({ ...form, telefono_contacto: e.target.value })} placeholder="+34 600 000 000" />
                </FG>
                <FG label="Email personal (notificaciones) *">
                  <input style={inputSt} type="email" value={form.email_personal} onChange={e => setForm({ ...form, email_personal: e.target.value })} required placeholder="personal@gmail.com" />
                </FG>
                <FG label="Dirección">
                  <input style={inputSt} value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Calle, número..." />
                </FG>
                <FG label="Ciudad">
                  <input style={inputSt} value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} />
                </FG>
                <FG label="Código postal">
                  <input style={inputSt} value={form.codigo_postal} onChange={e => setForm({ ...form, codigo_postal: e.target.value })} />
                </FG>
                <FG label="Provincia">
                  <input style={inputSt} value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value })} />
                </FG>
                <FG label="País">
                  <input style={inputSt} value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })} placeholder="España" />
                </FG>
              </div>
              <button type="submit" style={{ ...btnPrimary, opacity: savingInfo ? 0.7 : 1 }} disabled={savingInfo}>
                <Save size={16} /> {savingInfo ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>

          {/* Cambiar contraseña */}
          <div style={card}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#2c3e50' }}>
              <Lock size={18} color="#27ae60" /> Cambiar contraseña
            </h2>
            <form onSubmit={handleSavePass}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                <FG label="Contraseña actual *">
                  <input style={inputSt} type="password" value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
                </FG>
                <FG label="Nueva contraseña *">
                  <input style={inputSt} type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} required />
                </FG>
                <FG label="Confirmar contraseña *">
                  <input style={inputSt} type="password" value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} required />
                </FG>
              </div>
              <button type="submit" style={{ ...btnPrimary, opacity: savingPass ? 0.7 : 1 }} disabled={savingPass}>
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
