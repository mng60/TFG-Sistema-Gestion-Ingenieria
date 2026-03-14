import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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

  const particlesRef = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      left: (i * 6 + 4) % 96,
      delay: (i * 0.55) % 8,
      duration: 6 + (i % 5),
      size: 2 + (i % 3)
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
        <div className="login-split-form-inner">
          <button
            className="login-back-link"
            onClick={() => {
              navigate('/');
              window.scrollTo(0, 0);
            }}
          >
            ← BLUEARC ENERGY
          </button>

          {!showOlvide ? (
            <>
              <h1 className="login-split-title login-split-title--dark">INICIO DE SESION</h1>
              <p className="login-split-subtitle">Accede a tus proyectos y documentacion</p>

              <form onSubmit={handleSubmit} className="login-split-form-fields">
                {error && <div className="login-split-error">{error}</div>}

                <div className="login-split-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="login-split-group">
                  <label>
                    Contrasena
                    {capsLock && <span className="caps-warning">↑ Mayusculas activas</span>}
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
                    <button
                      type="button"
                      className="login-pwd-eye"
                      onClick={() => setShowPwd((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPwd ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    >
                      {showPwd ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-split-btn login-split-btn--teal" disabled={loading}>
                  {loading ? 'INICIANDO SESION...' : 'ACCEDER AL PORTAL →'}
                </button>
              </form>

              <div className="login-split-footer-links">
                <p className="login-help-text">¿Problemas? Contacta con tu gestor de proyecto</p>
                <button onClick={() => setShowOlvide(true)} className="login-split-link login-split-link--teal">
                  ¿Olvidaste tu contrasena?
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
          <path d="M0 180 L100 180 L100 90 L280 90" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" />
          <path d="M0 320 L140 320 L140 220 L380 220 L380 320 L500 320" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" />
          <path d="M200 0 L200 140 L320 140 L320 380" stroke="rgba(255,255,255,0.14)" strokeWidth="1.4" />
          <path d="M420 500 L420 280 L490 280 L490 600" stroke="rgba(255,255,255,0.09)" strokeWidth="1.4" />
          <path d="M60 520 L60 420 L220 420 L220 520 L420 520" stroke="rgba(255,255,255,0.09)" strokeWidth="1.4" />
          <circle cx="100" cy="180" r="4" fill="rgba(255,255,255,0.34)" />
          <circle cx="280" cy="90" r="4" fill="rgba(255,255,255,0.34)" />
          <circle cx="140" cy="320" r="4" fill="rgba(255,255,255,0.3)" />
          <circle cx="380" cy="220" r="4" fill="rgba(255,255,255,0.3)" />
          <circle cx="320" cy="380" r="6" fill="rgba(255,255,255,0.24)" />
        </svg>

        <div className="login-visual-content login-visual-content--cliente">
          <div className="login-visual-badge login-visual-badge--white">PORTAL CLIENTES</div>
          <h2>
            BLUE<span>ARC</span>
            <br />
            ENERGY
          </h2>
          <p>Seguimiento en tiempo real de tus proyectos de ingenieria electrica</p>
          <div className="login-visual-est">EST. 2018</div>
        </div>
      </div>
    </div>
  );
}

export default Login;
