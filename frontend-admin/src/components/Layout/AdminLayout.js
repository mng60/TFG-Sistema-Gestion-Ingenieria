import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEmpleadoAuth } from '../../context/EmpleadoAuthContext';
import '../../styles/AdminLayout.css';
import { MessagesSquare, UserRoundCog, BookUser, ChartColumnDecreasing, FolderOpen } from 'lucide-react';

function AdminLayout({ children }) {
  const { empleado, logout, isAdmin } = useEmpleadoAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isChat = location.pathname === '/chat';

  useEffect(() => {
    cargarMensajesNoLeidos();
    
    // Actualizar cada 10 segundos
    const interval = setInterval(cargarMensajesNoLeidos, 10000);
    return () => clearInterval(interval);
  }, []);

  const cargarMensajesNoLeidos = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');

      const response = await fetch(`${API_URL}/chat/conversaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (data.success) {
        const total = data.conversaciones.reduce((sum, conv) => {
          const noLeidos = parseInt(conv.mensajes_no_leidos) || 0;
          return sum + noLeidos;
        }, 0);

        setMensajesNoLeidos(total);
      }

    } catch (error) {
      console.error('Error al cargar mensajes no leídos:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/proyectos') {
      return location.pathname === path || location.pathname.startsWith('/proyectos/') ? 'active' : '';
    }
    return location.pathname === path ? 'active' : '';
  };

  const handleNavigateChat = () => {
    navigate('/chat');
    // Resetear contador al entrar al chat
    setTimeout(() => setMensajesNoLeidos(0), 500);
  };

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleChatNav = () => {
    handleNavigateChat();
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <h2>SGI</h2>
            <p>Sistema de Gestión</p>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${isActive('/dashboard')}`}
            onClick={() => handleNav('/dashboard')}
          >
            <ChartColumnDecreasing size={18}/> Dashboard
          </button>
          <button
            className={`nav-item ${isActive('/clientes')}`}
            onClick={() => handleNav('/clientes')}
          >
            <BookUser size={18}/> Clientes
          </button>
          <button
            className={`nav-item ${isActive('/proyectos')}`}
            onClick={() => handleNav('/proyectos')}
          >
            <FolderOpen size={18}/> Proyectos
          </button>
          <button
            className={`nav-item ${isActive('/chat')}`}
            onClick={handleChatNav}
          >
            <MessagesSquare size={18}/> Chat
            {mensajesNoLeidos > 0 && (
              <span className="notification-badge">{mensajesNoLeidos}</span>
            )}
          </button>
          {isAdmin() && (
            <button
              className={`nav-item ${isActive('/usuarios')}`}
              onClick={() => handleNav('/usuarios')}
            >
              <UserRoundCog size={18}/> Usuarios
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(empleado?.nombre || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <p className="user-name">{empleado?.nombre}</p>
              <p className="user-role">{empleado?.email || empleado?.rol}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`admin-content-wrapper${isChat ? ' admin-content-wrapper--chat' : ''}`}>
        <header className="admin-topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <span className="topbar-title">SGI</span>
          {mensajesNoLeidos > 0 && (
            <span className="topbar-badge">{mensajesNoLeidos}</span>
          )}
        </header>

        <main className={`admin-main${isChat ? ' admin-main--chat' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;