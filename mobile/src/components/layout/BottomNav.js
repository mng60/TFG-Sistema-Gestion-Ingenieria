import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);

  useEffect(() => {
    cargarNoLeidos();
    const interval = setInterval(cargarNoLeidos, 15000);
    return () => clearInterval(interval);
  }, []);

  const cargarNoLeidos = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');
      const res = await fetch(`${API_URL}/chat/conversaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const total = data.conversaciones.reduce(
          (sum, c) => sum + (parseInt(c.mensajes_no_leidos) || 0), 0
        );
        setMensajesNoLeidos(total);
      }
    } catch (_) {}
  };

  const isActive = (path) => {
    if (path === '/proyectos') {
      return location.pathname === path || location.pathname.startsWith('/proyectos/');
    }
    return location.pathname === path;
  };

  const handleChat = () => {
    navigate('/chat');
    setTimeout(() => setMensajesNoLeidos(0), 500);
  };

  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-item ${isActive('/proyectos') ? 'active' : ''}`}
        onClick={() => navigate('/proyectos')}
      >
        <span className="bottom-nav-icon">📁</span>
        Proyectos
      </button>

      <button
        className={`bottom-nav-item ${isActive('/chat') ? 'active' : ''}`}
        onClick={handleChat}
      >
        <span className="bottom-nav-icon">
          💬
          {mensajesNoLeidos > 0 && (
            <span className="bottom-nav-badge">
              {mensajesNoLeidos > 99 ? '99+' : mensajesNoLeidos}
            </span>
          )}
        </span>
        Chat
      </button>

      <button
        className={`bottom-nav-item ${isActive('/perfil') ? 'active' : ''}`}
        onClick={() => navigate('/perfil')}
      >
        <span className="bottom-nav-icon">👤</span>
        Perfil
      </button>
    </nav>
  );
}

export default BottomNav;
