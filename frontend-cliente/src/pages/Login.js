import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginSplit.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Login() {
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

  const { login } = useAuth();
  const navigate = useNavigate();

  // PRNG determinista con sin() — sin Math.random(), siempre igual, sin patrón visible
  const sr = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  const particlesRef = useRef(
    Array.from({ length: 32 }, (_, i) => ({
      id: i,
      left:     sr(i)        * 92 + 2,
      top:      sr(i + 50)   * 92 + 2,
      delay:    sr(i + 100)  * 6,
      duration: sr(i + 150)  * 8  + 7,
      size:     sr(i + 200)  * 8  + 4,
      opacity:  sr(i + 250)  * 0.25 + 0.15
    }))
  );

  React.useEffect(() => {
    document.title = 'Portal de Clientes - Login';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion. Verifica tus credenciales.');
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
          tipo_usuario: 'cliente',
          email: olvideEmail,
          mensaje: 'Solicitud de recuperacion de contrasena desde el portal de clientes.'
        })
      });

      setOlvideMsg('Solicitud enviada. Tu gestor de proyecto restablecera tu contrasena en breve.');
    } catch {
      setOlvideMsg('Error al enviar la solicitud. Intentalo de nuevo.');
    } finally {
      setOlvideLoading(false);
    }
  };

  return (
    <div className="login-split">
      <div className="login-split-form login-split-form--white">
        <button
          className="login-back-link"
          onClick={() => { navigate('/'); window.scrollTo(0, 0); }}
        >
          ← BLUEARC ENERGY
        </button>

        <div className="login-split-form-inner">
          {!showOlvide ? (
            <>
              <div className="login-split-heading">
                <h1 className="login-split-title login-split-title--dark">Bienvenido</h1>
                <p className="login-split-subtitle">Ingresa tus credenciales para acceder</p>
              </div>

              <form onSubmit={handleSubmit} className="login-split-form-fields">
                {error && <div className="login-split-error">{error}</div>}

                <div className="login-split-group">
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="login-split-group">
                  <label>
                    Contraseña
                    {capsLock && <span className="caps-warning">↑ Mayúsculas activas</span>}
                  </label>
                  <div className="login-pwd-wrap">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                      onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                      placeholder="Introduce tu contraseña"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="login-pwd-eye"
                      onClick={() => setShowPwd((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-split-btn login-split-btn--teal" disabled={loading}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </form>

              <div className="login-split-footer-links">
                <button onClick={() => setShowOlvide(true)} className="login-split-link login-split-link--teal">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </>
          ) : (
            <div className="login-split-form-fields">
              <h1 className="login-split-title login-split-title--dark login-split-title--small">RECUPERAR ACCESO</h1>
              <p className="login-split-subtitle">
                Introduce tu email y tu gestor recibira la solicitud para restablecer tu contrasena.
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
                      placeholder="tu@empresa.com"
                      required
                      disabled={olvideLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="login-split-btn login-split-btn--teal"
                    disabled={olvideLoading}
                    style={{ marginTop: 8 }}
                  >
                    {olvideLoading ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
                  </button>
                </form>
              )}

              <button
                onClick={() => {
                  setShowOlvide(false);
                  setOlvideMsg('');
                  setOlvideEmail('');
                }}
                className="login-split-link login-split-link--teal"
                style={{ marginTop: 12 }}
              >
                ← Volver al login
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="login-split-visual login-split-visual--teal">
        {/* Grid pattern */}
        <svg className="login-visual-grid" aria-hidden="true">
          <defs>
            <pattern id="lv-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lv-grid)" />
        </svg>

        {/* Floating particles */}
        <div className="login-visual-particles">
          {particlesRef.current.map((p) => (
            <span
              key={p.id}
              className="login-particle"
              style={{
                '--p-left':     `${p.left}%`,
                '--p-top':      `${p.top}%`,
                '--p-size':     `${p.size}px`,
                '--p-opacity':   p.opacity,
                '--p-delay':    `${p.delay}s`,
                '--p-duration': `${p.duration}s`
              }}
            />
          ))}
        </div>

        {/* Pulsing anchor dots */}
        <span className="login-particle-pulse login-pulse--1" />
        <span className="login-particle-pulse login-pulse--2" />
        <span className="login-particle-pulse login-pulse--3" />

        {/* Ripple rings */}
        <div className="login-ripple-wrap">
          <span className="login-ripple" />
          <span className="login-ripple" />
        </div>

        <div className="login-visual-content login-visual-content--cliente">
          <div className="login-visual-badge login-visual-badge--white">
            <Zap size={16} />
            PORTAL CLIENTES
          </div>
          <h2 className="login-visual-h2">BLUE<span>ARC</span></h2>
          <h2 className="login-visual-h2 login-visual-h2--mb">ENERGY</h2>
          <p>Seguimiento en tiempo real de tus proyectos</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
