import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOlvide, setShowOlvide] = useState(false);
  const [olvideEmail, setOlvideEmail] = useState('');
  const [olvideMsg, setOlvideMsg] = useState('');
  const [olvideLoading, setOlvideLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/proyectos');
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleOlvide = async (e) => {
    e.preventDefault();
    setOlvideLoading(true);
    try {
      await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo_usuario: 'empleado', email: olvideEmail, mensaje: 'Solicitud de recuperación de contraseña desde la app móvil.' })
      });
      setOlvideMsg('Solicitud enviada. Un administrador restablecerá tu contraseña en breve.');
    } catch {
      setOlvideMsg('Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setOlvideLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Panel Interno</h1>
          <p>Sistema de Gestión - Empleados</p>
        </div>

        {!showOlvide ? (
          <>
            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="empleado@empresa.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Acceder al Sistema'}
              </button>
            </form>

            <div className="login-footer">
              <p><small>Panel de gestión interna</small></p>
              <button
                onClick={() => setShowOlvide(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4DB6A8', fontSize: '0.85rem', marginTop: 8 }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </>
        ) : (
          <div className="login-form">
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#2c3e50' }}>Recuperar contraseña</h3>
            <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: 16 }}>
              Un administrador recibirá la solicitud y restablecerá tu contraseña.
            </p>
            {olvideMsg ? (
              <div style={{ padding: '12px 16px', borderRadius: 8, background: '#d4edda', color: '#155724', fontSize: '0.9rem', marginBottom: 12 }}>
                {olvideMsg}
              </div>
            ) : (
              <form onSubmit={handleOlvide}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={olvideEmail}
                    onChange={e => setOlvideEmail(e.target.value)}
                    placeholder="empleado@empresa.com"
                    required
                    autoComplete="email"
                    disabled={olvideLoading}
                  />
                </div>
                <button type="submit" className="login-button" disabled={olvideLoading}>
                  {olvideLoading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </form>
            )}
            <button
              onClick={() => { setShowOlvide(false); setOlvideMsg(''); setOlvideEmail(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4DB6A8', fontSize: '0.85rem', marginTop: 12 }}
            >
              ← Volver al login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
