import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookUser,
  ChartColumnDecreasing,
  FolderOpen,
  MessagesSquare,
  TicketCheck,
  UserRoundCog
} from 'lucide-react';
import { useEmpleadoAuth } from '../../context/EmpleadoAuthContext';
import '../../styles/AdminLayout.css';

function AdminLayout({ children }) {
  const { empleado, logout, isAdmin } = useEmpleadoAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [ticketsPendientes, setTicketsPendientes] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isChat = location.pathname === '/chat';
  const isTickets = location.pathname === '/tickets';

  useEffect(() => {
    if (isChat) {
      setMensajesNoLeidos(0);
      return;
    }
    cargarMensajesNoLeidos();
    const interval = setInterval(cargarMensajesNoLeidos, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChat]);

  useEffect(() => {
    if (isTickets) {
      setTicketsPendientes(0);
      return;
    }
    if (isAdmin()) cargarTicketsPendientes();
    const interval = setInterval(() => { if (isAdmin()) cargarTicketsPendientes(); }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTickets]);

  useEffect(() => {
    if (isTickets) setTicketsPendientes(0);
  }, [isTickets]);

  const cargarTicketsPendientes = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');
      const response = await fetch(`${API_URL}/tickets?estado=pendiente`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setTicketsPendientes(data.tickets?.length || 0);
    } catch {
      // silencioso
    }
  };

  const cargarMensajesNoLeidos = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('empleado_token');

      const response = await fetch(`${API_URL}/chat/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        const total = data.conversaciones.reduce((sum, conv) => {
          return sum + (parseInt(conv.mensajes_no_leidos, 10) || 0);
        }, 0);
        setMensajesNoLeidos(total);
      }
    } catch (error) {
      console.error('Error al cargar mensajes no leidos:', error);
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

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleChatNav = () => {
    navigate('/chat');
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <div>
              <h2>Portal Interno</h2>
              <p>BlueArc Energy</p>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${isActive('/dashboard')}`}
            onClick={() => handleNav('/dashboard')}
          >
            <ChartColumnDecreasing size={18} /> Dashboard
          </button>
          <button
            className={`nav-item ${isActive('/clientes')}`}
            onClick={() => handleNav('/clientes')}
          >
            <BookUser size={18} /> Clientes
          </button>
          <button
            className={`nav-item ${isActive('/proyectos')}`}
            onClick={() => handleNav('/proyectos')}
          >
            <FolderOpen size={18} /> Proyectos
          </button>
          <button
            className={`nav-item ${isActive('/chat')}`}
            onClick={handleChatNav}
          >
            <MessagesSquare size={18} /> Chat
            {mensajesNoLeidos > 0 && (
              <span className="notification-badge">{mensajesNoLeidos}</span>
            )}
          </button>
          {isAdmin() && (
            <button
              className={`nav-item ${isActive('/usuarios')}`}
              onClick={() => handleNav('/usuarios')}
            >
              <UserRoundCog size={18} /> Usuarios
            </button>
          )}
          {isAdmin() && (
            <button
              className={`nav-item ${isActive('/tickets')}`}
              onClick={() => { handleNav('/tickets'); setTicketsPendientes(0); }}
            >
              <TicketCheck size={18} /> Tickets
              {!isTickets && ticketsPendientes > 0 && (
                <span className="notification-badge">{ticketsPendientes}</span>
              )}
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" onClick={() => handleNav('/perfil')} style={{ cursor: 'pointer' }} title="Ver mi perfil">
            <div className="user-avatar">
              {empleado?.foto_url
                ? <img src={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${empleado.foto_url}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (empleado?.nombre || 'U').charAt(0).toUpperCase()
              }
            </div>
            <div className="user-details">
              <p className="user-name">{empleado?.nombre}</p>
              <p className="user-role">{empleado?.email || empleado?.rol}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesion
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
