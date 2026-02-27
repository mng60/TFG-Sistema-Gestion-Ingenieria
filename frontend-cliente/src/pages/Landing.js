import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNav from '../components/LandingNav';
import '../styles/Landing.css';

const pasos = [
  { titulo: 'Consulta Inicial',  desc: 'Analizamos tus necesidades energéticas y evaluamos el alcance del proyecto de forma personalizada.', icon: '💬' },
  { titulo: 'Proyecto Técnico',  desc: 'Elaboramos la memoria técnica completa con planos, cálculos eléctricos y presupuesto detallado.', icon: '📐' },
  { titulo: 'Aprobación',        desc: 'Revisamos el proyecto juntos y formalizamos el contrato con total transparencia y sin letra pequeña.', icon: '✅' },
  { titulo: 'Ejecución',         desc: 'Nuestro equipo certificado ejecuta la instalación con los más altos estándares de calidad y seguridad.', icon: '⚡' },
  { titulo: 'Legalización',      desc: 'Tramitamos toda la documentación y certificaciones ante los organismos oficiales por ti.', icon: '📋' },
  { titulo: 'Mantenimiento',     desc: 'Contratos de mantenimiento preventivo para garantizar el rendimiento óptimo a largo plazo.', icon: '🔧' },
];

function Landing() {
  const [activePaso, setActivePaso] = useState(0);
  const navigate = useNavigate();

  // Partículas generadas una sola vez (ref para evitar regenerar en cada render)
  const particlesRef = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: (i * 5.5 + 3) % 100,
      delay: (i * 0.45) % 8,
      duration: 6 + (i % 6),
      size: 2 + (i % 3),
    }))
  );

  const nextPaso = () => setActivePaso(p => (p + 1) % pasos.length);
  const prevPaso = () => setActivePaso(p => (p - 1 + pasos.length) % pasos.length);

  return (
    <div className="landing">
      <LandingNav />

      {/* ── HERO ── */}
      <section id="inicio" className="hero">

        {/* Panel izquierdo */}
        <div className="hero-left">
          <div className="hero-particles">
            {particlesRef.current.map(p => (
              <span key={p.id} className="particle" style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }} />
            ))}
          </div>
          <svg className="hero-circuit" viewBox="0 0 600 700" fill="none">
            <path d="M0 200 L100 200 L100 100 L300 100" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <path d="M0 350 L150 350 L150 250 L400 250 L400 350 L600 350" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
            <path d="M200 0 L200 150 L350 150 L350 400" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
            <path d="M450 500 L450 300 L550 300 L550 700" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
            <circle cx="100" cy="200" r="4" fill="rgba(255,255,255,0.15)" />
            <circle cx="300" cy="100" r="4" fill="rgba(255,255,255,0.15)" />
            <circle cx="150" cy="350" r="4" fill="rgba(255,255,255,0.12)" />
            <circle cx="400" cy="250" r="4" fill="rgba(255,255,255,0.12)" />
          </svg>

          <div className="hero-content">
            <p className="hero-tagline">Ingeniería Eléctrica de Vanguardia</p>
            <h1 className="hero-title">BLUE<span>ARC</span><br />ENERGY</h1>
            <p className="hero-subtitle">
              Transformamos infraestructuras energéticas<br />
              con tecnología, precisión y experiencia.
            </p>
            <div className="hero-cta-group">
              <button className="btn-hero-cta" onClick={() => navigate('/sobre-nosotros')}>
                Sobre Nosotros
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <button className="btn-hero-outline" onClick={() => navigate('/contacto')}>
                Contacto
              </button>
            </div>
          </div>
        </div>

        {/* Panel derecho: Ken Burns */}
        <div className="hero-right">
          <div className="hero-right-bg" />
          <div className="hero-right-overlay" />
          <div className="hero-right-label">
            <span>BLUEARC ENERGY</span>
            <span className="hero-right-year">EST. 2018</span>
          </div>
        </div>

      </section>

      {/* ── CÓMO TRABAJAMOS ── */}
      <section className="section-como">
        <div className="como-left">
          <span className="section-tag-white">01 — Cómo Trabajamos</span>
          <h2>CÓMO<br />TRABAJAMOS</h2>
          <p>
            Desde que iniciamos nuestra actividad en 2018, buscamos la excelencia
            en cada instalación eléctrica y proyecto de ingeniería que llevamos a cabo.
          </p>
          <button className="btn-ver-mas" onClick={() => navigate('/sobre-nosotros')}>
            VER MÁS →
          </button>
        </div>

        <div className="como-right">
          <div className="circle-container">
            {/* Anillo SVG */}
            <svg className="circle-ring" viewBox="0 0 400 400">
              <circle cx="200" cy="200" r="155" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              {pasos.map((_, i) => {
                const angle = (i / pasos.length) * 2 * Math.PI - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={200 + 155 * Math.cos(angle)}
                    y1={200 + 155 * Math.sin(angle)}
                    x2={200 + 95 * Math.cos(angle)}
                    y2={200 + 95 * Math.sin(angle)}
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>

            {/* Nodos interactivos */}
            {pasos.map((paso, i) => {
              const angle = (i / pasos.length) * 2 * Math.PI - Math.PI / 2;
              const x = 50 + 38.75 * Math.cos(angle);
              const y = 50 + 38.75 * Math.sin(angle);
              return (
                <button
                  key={i}
                  className={`circle-node ${activePaso === i ? 'active' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => setActivePaso(i)}
                  title={paso.titulo}
                >
                  <span>{paso.icon}</span>
                </button>
              );
            })}

            {/* Centro */}
            <div className="circle-center">
              <span className="paso-label">PASO {activePaso + 1}</span>
              <h3>{pasos[activePaso].titulo}</h3>
              <p>{pasos[activePaso].desc}</p>
              <button className="btn-ver-mas-sm" onClick={() => navigate('/sobre-nosotros')}>
                VER MÁS
              </button>
            </div>

            {/* Flechas navegación */}
            <button className="circle-nav circle-prev" onClick={prevPaso}>←</button>
            <button className="circle-nav circle-next" onClick={nextPaso}>→</button>
          </div>
        </div>
      </section>

      {/* ── POR QUÉ ELEGIRNOS ── */}
      <section className="section-valores">
        <div className="valores-header">
          <span className="section-tag">02 — Nuestros Valores</span>
          <h2>POR QUÉ<br />ELEGIRNOS</h2>
        </div>
        <div className="valores-grid">
          {[
            { num: '01', title: 'Experiencia',  text: 'Más de 15 años ejecutando proyectos de alta complejidad en sectores industrial y residencial.' },
            { num: '02', title: 'Seguridad',    text: 'Cumplimiento estricto del Reglamento Electrotécnico de Baja Tensión y normativas vigentes.' },
            { num: '03', title: 'Innovación',   text: 'Integramos tecnologías domóticas, fotovoltaicas y de gestión energética en cada proyecto.' },
            { num: '04', title: 'Compromiso',   text: 'Acompañamos al cliente desde el diseño hasta el mantenimiento con soporte técnico continuo.' },
          ].map(v => (
            <div key={v.num} className="valor-item">
              <div className="valor-num">{v.num}</div>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
        <div className="valores-stats">
          <div className="vstat"><span className="vstat-n">+500</span><span className="vstat-l">Proyectos</span></div>
          <div className="vstat"><span className="vstat-n">15</span><span className="vstat-l">Años</span></div>
          <div className="vstat"><span className="vstat-n">98%</span><span className="vstat-l">Satisfacción</span></div>
          <div className="vstat"><span className="vstat-n">24h</span><span className="vstat-l">Respuesta</span></div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="section-cta">
        <h2>¿LISTO PARA TU<br />PRÓXIMO PROYECTO?</h2>
        <p>Cuéntanos lo que necesitas y te ayudamos a hacerlo realidad.</p>
        <button className="btn-cta-main" onClick={() => navigate('/contacto')}>
          Solicita presupuesto
        </button>
      </section>

      {/* ── FOOTER ── */}
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

export default Landing;
