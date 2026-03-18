import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';
import api from '../services/api';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOlvide, setShowOlvide] = useState(false);
  const [olvideEmail, setOlvideEmail] = useState('');
  const [olvideMsg, setOlvideMsg] = useState('');
  const [olvideLoading, setOlvideLoading] = useState(false);

  const particlesRef = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: (i * 10 + 5) % 95,
      delay: (i * 0.7) % 6,
      duration: 5 + (i % 4),
      size: 2 + (i % 3)
    }))
  );

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
      await api.post('/tickets', { tipo: 'olvido_password', email: olvideEmail });
      setOlvideMsg('Solicitud enviada. Un administrador restablecera tu contrasena en breve.');
    } catch {
      setOlvideMsg('Error al enviar la solicitud. Intentalo de nuevo.');
    } finally {
      setOlvideLoading(false);
    }
  };

  return (
    <div className="mobile-login">
      <div className="mobile-login-visual">
        <div className="mobile-login-particles">
          {particlesRef.current.map((p) => (
            <span
              key={p.id}
              className="mobile-login-particle"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`
              }}
            />
          ))}
        </div>

        <div className="mobile-login-brand">
          <img src="/logo.png" alt="BlueArc Energy" className="mobile-login-logo" />
          <h2 className="mobile-login-brand-name">BlueArc</h2>
          <p className="mobile-login-brand-sub">Sistema de Gestion de Ingenieria</p>
        </div>
      </div>

      <div className="mobile-login-form-panel">
        <div className="mobile-login-form-inner">
          {!showOlvide ? (
            <>
              <h1 className="mobile-login-title">INICIO DE SESION</h1>
              <p className="mobile-login-subtitle">Accede con tus credenciales</p>

              <form onSubmit={handleSubmit} className="mobile-login-fields">
                {error && <div className="mobile-login-error">{error}</div>}

                <div className="mobile-login-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="empleado@empresa.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <div className="mobile-login-group">
                  <label>
                    Contrasena
                    {capsLock && <span className="caps-warning">↑ Mayusculas activas</span>}
                  </label>
                  <div className="mobile-pwd-wrap">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                      onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="mobile-pwd-eye"
                      onClick={() => setShowPwd((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPwd ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    >
                      {showPwd ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="mobile-login-btn" disabled={loading}>
                  {loading ? 'Iniciando sesion...' : 'ACCEDER AL SISTEMA'}
                </button>
              </form>

              <button onClick={() => setShowOlvide(true)} className="mobile-login-link">
                ¿Olvidaste tu contrasena?
              </button>
            </>
          ) : (
            <>
              <h1 className="mobile-login-title">RECUPERAR ACCESO</h1>
              <p className="mobile-login-subtitle">
                Un administrador recibira la solicitud y restablecera tu contrasena.
              </p>

              {olvideMsg ? (
                <div className="mobile-login-success">{olvideMsg}</div>
              ) : (
                <form onSubmit={handleOlvide} className="mobile-login-fields">
                  <div className="mobile-login-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={olvideEmail}
                      onChange={(e) => setOlvideEmail(e.target.value)}
                      placeholder="empleado@empresa.com"
                      required
                      autoComplete="email"
                      disabled={olvideLoading}
                    />
                  </div>
                  <button type="submit" className="mobile-login-btn" disabled={olvideLoading}>
                    {olvideLoading ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </form>
              )}

              <button
                onClick={() => {
                  setShowOlvide(false);
                  setOlvideMsg('');
                  setOlvideEmail('');
                }}
                className="mobile-login-link"
              >
                ← Volver al login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
