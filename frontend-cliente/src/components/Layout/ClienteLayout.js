import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ClienteLayout.css';

function ClienteLayout({ children }) {
  const { cliente, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isChat = location.pathname === '/chat';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="cliente-layout">
      {/* Sidebar */}
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
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">📁</span>
            <span>Mis Proyectos</span>
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon">💬</span>
            <span>Chat</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(cliente?.nombre_empresa || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{cliente?.nombre_empresa || 'Cliente'}</span>
              <span className="user-email">{cliente?.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Contenido principal */}
      <div className="cliente-main">
        {/* Topbar móvil */}
        <header className="cliente-topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <span className="topbar-title">Portal Cliente</span>
        </header>

        <main className={`cliente-content${isChat ? ' cliente-content--chat' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default ClienteLayout;
