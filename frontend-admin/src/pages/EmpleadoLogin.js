import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import '../styles/Login.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// PRNG determinista con sin() — sin Math.random(), siempre igual, sin patrón visible
const sr = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const particles = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  left:     sr(i)        * 96 + 2,
  top:      sr(i + 50)   * 96 + 2,
  delay:    sr(i + 100)  * 8,
  duration: sr(i + 150)  * 10 + 8,
  size:     sr(i + 200)  * 5  + 2,
  opacity:  sr(i + 250)  * 0.3 + 0.1,
}));

// Líneas SVG decorativas precalculadas (viewBox 0 0 100 100)
const svgLines = [
  { d: 'M10 0 L10 38 L35 38 L35 62 L58 62',        dots: [[10,38],[35,38],[35,62]] },
  { d: 'M28 100 L28 74 L55 74 L55 45 L80 45',       dots: [[28,74],[55,74],[55,45]] },
  { d: 'M70 0 L70 28 L90 28 L90 55 L100 55',        dots: [[70,28],[90,28]] },
  { d: 'M0 22 L18 22 L18 50 L42 50',                dots: [[18,22],[18,50]] },
  { d: 'M60 100 L60 80 L82 80 L82 60 L100 60',      dots: [[60,80],[82,80]] },
  { d: 'M0 68 L22 68 L22 88 L48 88 L48 100',        dots: [[22,68],[22,88]] },
  { d: 'M45 0 L45 18 L72 18 L72 35 L100 35',        dots: [[45,18],[72,18]] },
  { d: 'M85 100 L85 72 L100 72',                    dots: [[85,72]] },
];

function EmpleadoLogin() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [capsLock, setCapsLock]         = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [showOlvide, setShowOlvide]     = useState(false);
  const [olvideEmail, setOlvideEmail]   = useState('');
  const [olvideMsg, setOlvideMsg]       = useState('');
  const [olvideLoading, setOlvideLoading] = useState(false);

  const { login } = useEmpleadoAuth();
  const navigate  = useNavigate();

  React.useEffect(() => { document.title = 'Portal Empleados - Login'; }, []);

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
          mensaje: 'Solicitud de recuperación de contraseña desde el login.',
        }),
      });
      setOlvideMsg('Solicitud enviada. Un administrador restablecerá tu contraseña en breve.');
    } catch {
      setOlvideMsg('Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setOlvideLoading(false);
    }
  };

  return (
    <div className="dark-login">

      {/* Partículas flotantes full-screen */}
      <div className="dark-particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="dark-particle"
            style={{
              '--p-left':     `${p.left}%`,
              '--p-top':      `${p.top}%`,
              '--p-size':     `${p.size}px`,
              '--p-opacity':   p.opacity,
              '--p-delay':    `${p.delay}s`,
              '--p-duration': `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Líneas SVG decorativas */}
      <svg className="dark-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="rgba(45,212,191,0.6)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.2)" />
          </linearGradient>
        </defs>
        {svgLines.map((line, i) => (
          <g key={i}>
            <path d={line.d} stroke="url(#lg1)" strokeWidth="0.3" fill="none" />
            {line.dots.map(([cx, cy], j) => (
              <circle key={j} cx={cx} cy={cy} r="0.6" fill="rgba(45,212,191,0.55)" />
            ))}
          </g>
        ))}
      </svg>

      {/* Panel izquierdo — branding */}
      <div className="dark-left">
        <div className="dark-logo-wrap">
          <div className="dark-logo-glow" />
          <img src="/logo.png" alt="BlueArc Energy" className="dark-logo-img" />
        </div>

        <div className="dark-brand">
          <h1>
            <span className="brand-teal">BLUE</span>
            <span className="brand-white">ARC</span>
            <br />
            <span className="brand-white">ENERGY</span>
          </h1>
          <p>PORTAL EMPLEADOS</p>
        </div>

        <div className="dark-bullets">
          <div className="dark-bullet">
            <span className="dark-bullet-dot" />
            Gestión de proyectos e ingeniería
          </div>
          <div className="dark-bullet">
            <span className="dark-bullet-dot" />
            Seguimiento de clientes y equipos
          </div>
          <div className="dark-bullet">
            <span className="dark-bullet-dot" />
            Comunicación en tiempo real
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="dark-right">
        <div className="dark-card">
          <div className="dark-card-glow" />
          <div className="dark-card-inner">

            {!showOlvide ? (
              <>
                <h2 className="dark-card-title">Bienvenido</h2>
                <p className="dark-card-subtitle">Accede con tus credenciales corporativas</p>

                <form onSubmit={handleSubmit} className="dark-form">
                  {error && <div className="dark-error">{error}</div>}

                  <div className="dark-group">
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

                  <div className="dark-group">
                    <label>
                      Contraseña
                      {capsLock && <span className="dark-caps">↑ Mayúsculas activas</span>}
                    </label>
                    <div className="dark-pwd-wrap">
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
                        className="dark-pwd-eye"
                        onClick={() => setShowPwd((v) => !v)}
                        tabIndex={-1}
                        aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="dark-forgot-row">
                    <button type="button" className="dark-link" onClick={() => setShowOlvide(true)}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button type="submit" className="dark-btn" disabled={loading}>
                    {loading ? 'Accediendo...' : 'ACCEDER AL SISTEMA'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="dark-recover-title">Recuperar acceso</p>
                <p className="dark-recover-sub">
                  Introduce tu email y un administrador recibirá la solicitud para restablecer tu contraseña.
                </p>

                {olvideMsg ? (
                  <div className="dark-success">{olvideMsg}</div>
                ) : (
                  <form onSubmit={handleOlvide} className="dark-form">
                    <div className="dark-group">
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
                    <button type="submit" className="dark-btn" disabled={olvideLoading}>
                      {olvideLoading ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                  </form>
                )}

                <button
                  className="dark-link"
                  style={{ marginTop: 16, display: 'block' }}
                  onClick={() => { setShowOlvide(false); setOlvideMsg(''); setOlvideEmail(''); }}
                >
                  ← Volver al login
                </button>
              </>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}

export default EmpleadoLogin;
