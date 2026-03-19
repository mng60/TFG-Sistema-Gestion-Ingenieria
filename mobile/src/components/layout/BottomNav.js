import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FolderOpen, MessagesSquare, CircleUserRound } from 'lucide-react';

const BACKEND = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { empleado } = useAuth();
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);

  useEffect(() => {
    if (location.pathname === '/chat') {
      setMensajesNoLeidos(0);
      return;
    }
    cargarNoLeidos();
    const interval = setInterval(cargarNoLeidos, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const cargarNoLeidos = async () => {
    if (location.pathname === '/chat') {
      setMensajesNoLeidos(0);
      return;
    }
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
        <span className="bottom-nav-icon"><FolderOpen size={22}/></span>
        Proyectos
      </button>

      <button
        className={`bottom-nav-item ${isActive('/chat') ? 'active' : ''}`}
        onClick={handleChat}
      >
        <span className="bottom-nav-icon">
          <MessagesSquare size={22}/>
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
        <span className="bottom-nav-icon">
          {empleado?.foto_url
            ? <img src={`${BACKEND}${empleado.foto_url}`} alt="av" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
            : <CircleUserRound size={22} />
          }
        </span>
        Perfil
      </button>
    </nav>
  );
}

export default BottomNav;
