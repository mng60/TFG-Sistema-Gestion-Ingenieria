import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNav from '../components/LandingNav';
import '../styles/Landing.css';
import '../styles/Contacto.css';

function Contacto() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nombre: '', empresa: '', email: '', telefono: '', mensaje: '' });
  const [formSent, setFormSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSent(true);
    setFormData({ nombre: '', empresa: '', email: '', telefono: '', mensaje: '' });
    setTimeout(() => setFormSent(false), 5000);
  };

  return (
    <div className="landing">
      <LandingNav />

      {/* Hero */}
      <div className="page-hero">
        <div className="page-hero-inner">
          <span className="section-tag-white">03 — Contacto</span>
          <h1>HABLEMOS<br />DE TU PROYECTO</h1>
        </div>
      </div>

      {/* Contacto principal */}
      <section className="contacto-main">
        <div className="contacto-info">
          <h2>¿Cómo podemos<br />ayudarte?</h2>
          <p>
            Cuéntanos lo que necesitas y te contactaremos en menos de 24 horas.
            Sin compromiso, sin letra pequeña.
          </p>

          <div className="contacto-datos">
            <div className="dato-bloque">
              <span className="dato-label">Email</span>
              <span>info@bluearc-energy.com</span>
            </div>
            <div className="dato-bloque">
              <span className="dato-label">Teléfono</span>
              <span>+34 900 123 456</span>
            </div>
            <div className="dato-bloque">
              <span className="dato-label">Dirección</span>
              <span>Polígono Industrial Norte, Nave 12<br />28000 Madrid, España</span>
            </div>
            <div className="dato-bloque">
              <span className="dato-label">Horario</span>
              <span>Lunes – Viernes: 8:00 – 18:00</span>
            </div>
          </div>

          <div className="contacto-area-link">
            <p>¿Ya eres cliente? Accede a tu área privada.</p>
            <button className="btn-portal" onClick={() => navigate('/login')}>
              Acceder al portal →
            </button>
          </div>
        </div>

        <div className="contacto-form-col">
          {formSent ? (
            <div className="form-success">
              <div className="form-success-icon">✓</div>
              <h3>Mensaje enviado</h3>
              <p>Nos pondremos en contacto contigo en breve. ¡Gracias!</p>
            </div>
          ) : (
            <form className="contacto-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input type="text" required placeholder="Tu nombre"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Empresa</label>
                  <input type="text" placeholder="Tu empresa"
                    value={formData.empresa}
                    onChange={e => setFormData({ ...formData, empresa: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" required placeholder="tu@email.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" placeholder="+34 600 000 000"
                    value={formData.telefono}
                    onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Mensaje *</label>
                <textarea required rows={6} placeholder="Cuéntanos tu proyecto..."
                  value={formData.mensaje}
                  onChange={e => setFormData({ ...formData, mensaje: e.target.value })} />
              </div>
              <button type="submit" className="btn-submit-form">
                Enviar mensaje
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <img src="/logo2.png" alt="BlueArc Energy" className="footer-logo" />
          <p>© 2025 BlueArc Energy. Todos los derechos reservados.</p>
          <button className="footer-area-cliente" onClick={() => navigate('/login')}>
            Área Cliente →
          </button>
        </div>
      </footer>
    </div>
  );
}

export default Contacto;
