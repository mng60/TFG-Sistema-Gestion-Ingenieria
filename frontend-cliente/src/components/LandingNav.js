import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
    window.scrollTo(0, 0);
  };

  const handleAreaCliente = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  return (
    <>
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo" onClick={() => goTo('/')}>
          <img src="/logo2.png" alt="BlueArc Energy" />
        </div>
        <div className="nav-actions">
          <button className="btn-area-cliente" onClick={handleAreaCliente}>
            Área Cliente
          </button>
          <button className="btn-hamburger" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Overlay menú */}
      <div className={`nav-overlay ${menuOpen ? 'open' : ''}`}>
        <div className="nav-overlay-inner">
          <div className="nav-overlay-left">
            <button className="btn-close-menu" onClick={() => setMenuOpen(false)}>
              <span /><span />
            </button>
            <ul className="nav-menu-list">
              <li onClick={() => goTo('/')}>
                <span className="menu-num">01</span>Inicio
              </li>
              <li onClick={() => goTo('/sobre-nosotros')}>
                <span className="menu-num">02</span>Sobre Nosotros
              </li>
              <li onClick={() => goTo('/contacto')}>
                <span className="menu-num">03</span>Contacto
              </li>
            </ul>
            <div className="nav-overlay-footer">
              <p>info@bluearc-energy.com</p>
              <p>+34 900 123 456</p>
            </div>
          </div>
          <div className="nav-overlay-right">
            <svg className="deco-swoosh" viewBox="0 0 400 500" fill="none">
              <path d="M 380 20 C 300 80, 120 100, 60 200 S 80 380, 20 450" stroke="#CC2929" strokeWidth="1.5" fill="none" />
              <path d="M 350 10 C 280 90, 100 120, 40 220 S 60 400, 10 470" stroke="#CC2929" strokeWidth="0.6" fill="none" opacity="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}

export default LandingNav;
