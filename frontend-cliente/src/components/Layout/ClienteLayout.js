import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, FolderOpen, MessagesSquare, LogOut, Inbox } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAvatarInitial, getAvatarSrc } from '../../utils/format';
import '../../styles/ClienteLayout.css';

// PRNG determinista con sin() — sin Math.random(), siempre igual, sin patrón visible
const sr = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const sidebarParticles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left:     sr(i)        * 88 + 4,
  top:      sr(i + 50)   * 88 + 4,
  delay:    sr(i + 100)  * 6,
  duration: sr(i + 150)  * 10 + 9,
  size:     sr(i + 200)  * 5  + 3,
  opacity:  sr(i + 250)  * 0.18 + 0.08
}));

function ClienteLayout({ children }) {
  const { cliente, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const isChat = location.pathname === '/chat';
  const isProjectsSection = location.pathname === '/dashboard' || location.pathname.startsWith('/proyectos/');
  const isSolicitudSection = location.pathname === '/solicitar-proyecto';
  const isMisSolicitudesSection = location.pathname === '/mis-solicitudes';

  useEffect(() => {
    if (isChat) {
      setMensajesNoLeidos(0);
      return;
    }
    const cargar = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${API_URL}/chat/conversaciones`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.success) {
          const total = data.conversaciones.reduce((sum, conv) =>
            sum + (parseInt(conv.mensajes_no_leidos, 10) || 0), 0);
          setMensajesNoLeidos(total);
        }
      } catch { /* silencioso */ }
    };
    cargar();
    const interval = setInterval(cargar, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChat]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="cliente-layout">
      <aside className={`cliente-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Partículas flotantes */}
        <div className="sidebar-particles" aria-hidden="true">
          {sidebarParticles.map((p) => (
            <span
              key={p.id}
              className="sidebar-particle"
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

        {/* Línea de scan sutil */}
        <div className="sidebar-scanlines" aria-hidden="true">
          <span className="scanline--h" />
          <span className="scanline--v" />
        </div>

        {/* Logo */}
        <div className="sidebar-logo-area">
          <div className="sidebar-logo-icon">
            <img src="/logo.png" alt="BlueArc Energy" style={{ width: 42, height: 42, borderRadius: 10, display: 'block' }} />
          </div>
          <div className="sidebar-txt sidebar-logo-text">
            <span className="logo-bluearc">BLUEARC</span>
            <span className="logo-energy">ENERGY</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        {/* Navegación */}
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={() => `nav-item ${isProjectsSection ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FolderOpen size={20} className="nav-icon-svg" />
            <span className="nav-label sidebar-txt">Mis Proyectos</span>
          </NavLink>

          <NavLink
            to="/solicitar-proyecto"
            className={() => `nav-item ${isSolicitudSection ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <ClipboardList size={20} className="nav-icon-svg" />
            <span className="nav-label sidebar-txt">Solicitar Proyecto</span>
          </NavLink>

          <NavLink
            to="/mis-solicitudes"
            className={() => `nav-item ${isMisSolicitudesSection ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Inbox size={20} className="nav-icon-svg" />
            <span className="nav-label sidebar-txt">Mis Solicitudes</span>
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <MessagesSquare size={20} className="nav-icon-svg" />
            <span className="nav-label sidebar-txt">Chat</span>
            {mensajesNoLeidos > 0 && (
              <span className="notification-badge sidebar-txt">{mensajesNoLeidos}</span>
            )}
          </NavLink>

        </nav>

        {/* Footer usuario */}
        <div className="sidebar-footer">
          <div
            className="user-info"
            onClick={() => { navigate('/perfil'); setSidebarOpen(false); }}
            title="Ver mi perfil"
          >
            <div className="user-avatar">
              {getAvatarSrc(cliente?.foto_url)
                ? <img
                    src={getAvatarSrc(cliente.foto_url)}
                    alt="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                : getAvatarInitial(cliente?.nombre_empresa, 'C')
              }
            </div>
            <div className="user-details sidebar-txt">
              <span className="user-name">{cliente?.nombre_empresa || 'Cliente'}</span>
              <span className="user-email">{cliente?.email}</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} className="nav-icon-svg" />
            <span className="sidebar-txt">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="cliente-main">
        <header className="cliente-topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <span className="topbar-title">Portal Cliente</span>
          {mensajesNoLeidos > 0 && (
            <span className="topbar-badge">{mensajesNoLeidos}</span>
          )}
        </header>

        <main className={`cliente-content${isChat ? ' cliente-content--chat' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default ClienteLayout;
