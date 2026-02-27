import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MobileLayout from '../components/layout/MobileLayout';

function Perfil() {
  const { empleado, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inicial = (empleado?.nombre || 'U').charAt(0).toUpperCase();

  return (
    <MobileLayout>
      <div style={{ padding: '8px 0', maxWidth: 480, margin: '0 auto' }}>
        {/* Avatar + nombre */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '28px 20px',
          textAlign: 'center', marginBottom: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', fontSize: '2rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            {inicial}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>
            {empleado?.nombre}
          </h2>
          <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: 12 }}>
            {empleado?.email}
          </p>
          <span style={{
            background: isAdmin() ? '#667eea' : '#e9ecef',
            color: isAdmin() ? 'white' : '#2c3e50',
            borderRadius: 20, padding: '4px 14px',
            fontSize: '0.8rem', fontWeight: 600
          }}>
            {isAdmin() ? '⚡ Administrador' : '👤 Empleado'}
          </span>
        </div>

        {/* Info adicional */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '16px 20px',
          marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#7f8c8d', fontWeight: 500 }}>Email</div>
              <div style={{ fontSize: '0.95rem' }}>{empleado?.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#7f8c8d', fontWeight: 500 }}>Rol</div>
              <div style={{ fontSize: '0.95rem', textTransform: 'capitalize' }}>{empleado?.rol}</div>
            </div>
          </div>
        </div>

        {/* Nota acceso desktop */}
        {isAdmin() && (
          <div style={{
            background: '#f0f4ff', borderRadius: 12, padding: '12px 16px',
            marginBottom: 12, fontSize: '0.82rem', color: '#667eea',
            border: '1px solid #dbeafe'
          }}>
            💡 Para gestión completa (estadísticas, usuarios, clientes, presupuestos) usa el portal web de administración.
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '14px', background: '#fee2e2',
            color: '#dc2626', border: 'none', borderRadius: 12,
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </MobileLayout>
  );
}

export default Perfil;
