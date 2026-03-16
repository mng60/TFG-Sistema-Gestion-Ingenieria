import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, FolderOpen, MessagesSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ClienteLayout.css';

function ClienteLayout({ children }) {
  const { cliente, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const isChat = location.pathname === '/chat';
  const isProjectsSection = location.pathname === '/dashboard' || location.pathname.startsWith('/proyectos/');
  const isSolicitudSection = location.pathname === '/solicitar-proyecto';

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
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-text">Portal Cliente</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={() => `nav-item ${isProjectsSection ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FolderOpen size={18} /> Mis Proyectos
          </NavLink>

          <NavLink
            to="/solicitar-proyecto"
            className={() => `nav-item ${isSolicitudSection ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <ClipboardList size={18} /> Solicitar Proyecto
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <MessagesSquare size={18} /> Chat
            {mensajesNoLeidos > 0 && (
              <span className="notification-badge">{mensajesNoLeidos}</span>
            )}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div
            className="user-info"
            onClick={() => { navigate('/perfil'); setSidebarOpen(false); }}
            style={{ cursor: 'pointer' }}
            title="Ver mi perfil"
          >
            <div className="user-avatar">
              {cliente?.foto_url
                ? <img src={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${cliente.foto_url}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (cliente?.nombre_empresa || 'C').charAt(0).toUpperCase()
              }
            </div>
            <div className="user-details">
              <span className="user-name">{cliente?.nombre_empresa || 'Cliente'}</span>
              <span className="user-email">{cliente?.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesion
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
