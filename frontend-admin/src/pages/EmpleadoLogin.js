import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import '../styles/LoginSplit.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function EmpleadoLogin() {
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

  const { login } = useEmpleadoAuth();
  const navigate = useNavigate();

  const particlesRef = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: (i * 7 + 5) % 95,
      delay: (i * 0.6) % 7,
      duration: 5 + (i % 5),
      size: 2 + (i % 3)
    }))
  );

  React.useEffect(() => {
    document.title = 'Portal Empleados - Login';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
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
        body: JSON.stringify({
          tipo_usuario: 'empleado',
          email: olvideEmail,
          mensaje: 'Solicitud de recuperación de contraseña desde el login.'
        })
      });
      setOlvideMsg('Solicitud enviada. Un administrador restablecerá tu contraseña en breve.');
    } catch {
      setOlvideMsg('Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setOlvideLoading(false);
    }
  };

  return (
    <div className="login-split">
      <div className="login-split-form">
        <div className="login-split-form-inner">
          <div className="login-brand-inline">BLUEARC<span>ENERGY</span></div>

          <h1 className="login-split-title">INICIO DE SESIÓN</h1>
          <p className="login-split-subtitle">Sistema de Gestión</p>

          {!showOlvide ? (
            <>
              <form onSubmit={handleSubmit} className="login-split-form-fields">
                {error && <div className="login-split-error">{error}</div>}

                <div className="login-split-group">
                  <label>Email corporativo</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="empleado@empresa.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="login-split-group">
                  <label>
                    Contraseña {capsLock && <span className="caps-warning">↑ Mayúsculas activas</span>}
                  </label>
                  <div className="login-pwd-wrap">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                      onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                    <button type="button" className="login-pwd-eye" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                      {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-split-btn" disabled={loading}>
                  {loading ? 'Accediendo...' : 'ACCEDER AL SISTEMA'}
                </button>
              </form>

              <button onClick={() => setShowOlvide(true)} className="login-split-link">
                ¿Olvidaste tu contraseña?
              </button>
            </>
          ) : (
            <div className="login-split-form-fields">
              <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#2c3e50' }}>Recuperar contraseña</h3>
              <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: 16 }}>
                Introduce tu email y un administrador recibirá la solicitud.
              </p>
              {olvideMsg ? (
                <div className="login-split-success">{olvideMsg}</div>
              ) : (
                <form onSubmit={handleOlvide}>
                  <div className="login-split-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={olvideEmail}
                      onChange={(e) => setOlvideEmail(e.target.value)}
                      placeholder="empleado@empresa.com"
                      required
                      disabled={olvideLoading}
                    />
                  </div>
                  <button type="submit" className="login-split-btn" disabled={olvideLoading} style={{ marginTop: 8 }}>
                    {olvideLoading ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </form>
              )}
              <button
                onClick={() => { setShowOlvide(false); setOlvideMsg(''); setOlvideEmail(''); }}
                className="login-split-link"
                style={{ marginTop: 12 }}
              >
                ← Volver al login
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="login-split-visual login-split-visual--dark">
        <div className="login-visual-particles">
          {particlesRef.current.map((p) => (
            <span
              key={p.id}
              className="login-particle"
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
        <svg className="login-visual-circuit" viewBox="0 0 500 600" fill="none">
          <path d="M0 150 L80 150 L80 80 L250 80" stroke="rgba(77,182,168,0.15)" strokeWidth="1.5" />
          <path d="M0 300 L120 300 L120 200 L350 200 L350 300 L500 300" stroke="rgba(77,182,168,0.1)" strokeWidth="1.5" />
          <path d="M180 0 L180 120 L300 120 L300 350" stroke="rgba(77,182,168,0.12)" strokeWidth="1.5" />
          <path d="M400 450 L400 250 L480 250 L480 600" stroke="rgba(77,182,168,0.08)" strokeWidth="1.5" />
          <path d="M50 500 L50 400 L200 400 L200 500 L400 500" stroke="rgba(77,182,168,0.07)" strokeWidth="1.5" />
          <circle cx="80" cy="150" r="4" fill="rgba(77,182,168,0.3)" />
          <circle cx="250" cy="80" r="4" fill="rgba(77,182,168,0.3)" />
          <circle cx="120" cy="300" r="4" fill="rgba(77,182,168,0.25)" />
          <circle cx="350" cy="200" r="4" fill="rgba(77,182,168,0.25)" />
          <circle cx="300" cy="350" r="6" fill="rgba(77,182,168,0.2)" />
        </svg>
        <div className="login-visual-content">
          <div className="login-visual-badge">BLUEARC ENERGY · PORTAL EMPLEADOS</div>
          <h2>PORTAL<br /><span>INTERNO</span></h2>
          <p>Gestión centralizada de proyectos, clientes y equipos de ingeniería</p>
        </div>
      </div>
    </div>
  );
}

export default EmpleadoLogin;
