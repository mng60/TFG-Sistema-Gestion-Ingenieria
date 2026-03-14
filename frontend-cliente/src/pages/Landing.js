import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNav from '../components/LandingNav';
import { MessageCircle, FileText, CheckSquare, Zap, ClipboardList, Wrench } from 'lucide-react';
import '../styles/Landing.css';

const PASO_ICONS = [
  <MessageCircle size={22} strokeWidth={1.8} />,
  <FileText size={22} strokeWidth={1.8} />,
  <CheckSquare size={22} strokeWidth={1.8} />,
  <Zap size={22} strokeWidth={1.8} />,
  <ClipboardList size={22} strokeWidth={1.8} />,
  <Wrench size={22} strokeWidth={1.8} />,
];

const pasos = [
  { titulo: 'Consulta Inicial',  desc: 'Analizamos tus necesidades energéticas y evaluamos el alcance del proyecto de forma personalizada.' },
  { titulo: 'Proyecto Técnico',  desc: 'Elaboramos la memoria técnica completa con planos, cálculos eléctricos y presupuesto detallado.' },
  { titulo: 'Aprobación',        desc: 'Revisamos el proyecto juntos y formalizamos el contrato con total transparencia y sin letra pequeña.' },
  { titulo: 'Ejecución',         desc: 'Nuestro equipo certificado ejecuta la instalación con los más altos estándares de calidad y seguridad.' },
  { titulo: 'Legalización',      desc: 'Tramitamos toda la documentación y certificaciones ante los organismos oficiales por ti.' },
  { titulo: 'Mantenimiento',     desc: 'Contratos de mantenimiento preventivo para garantizar el rendimiento óptimo a largo plazo.' },
];

const STEP = 360 / pasos.length; // 60°

function Landing() {
  const [activePaso, setActivePaso] = useState(0);
  const [rotationAngle, setRotationAngle] = useState(0);
  const navigate = useNavigate();

  // Partículas hero generadas una sola vez
  const particlesRef = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: (i * 5.5 + 3) % 100,
      delay: (i * 0.45) % 8,
      duration: 6 + (i % 6),
      size: 2 + (i % 3),
    }))
  );

  // Partículas sección "Cómo Trabajamos" generadas una sola vez
  const comoParticlesRef = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: (i * 7.2 + 2) % 98,
      delay: (i * 0.6 + 1) % 9,
      duration: 7 + (i % 5),
      size: 1.5 + (i % 3),
    }))
  );

  const goTo = (i) => {
    const n = pasos.length;
    const current = activePaso;
    let diff = i - current;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    setRotationAngle(r => r - diff * STEP);
    setActivePaso(i);
  };

  const nextPaso = () => goTo((activePaso + 1) % pasos.length);
  const prevPaso = () => goTo((activePaso - 1 + pasos.length) % pasos.length);

  const navTo = (path) => { navigate(path); window.scrollTo(0, 0); };

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
        {/* Fondo animado */}
        <div className="como-particles">
          {comoParticlesRef.current.map(p => (
            <span key={p.id} className="como-particle" style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }} />
          ))}
        </div>
        <svg className="como-circuit" viewBox="0 0 800 600" fill="none">
          <path d="M0 150 L120 150 L120 80 L340 80" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
          <path d="M0 300 L180 300 L180 200 L460 200 L460 300 L800 300" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
          <path d="M250 0 L250 160 L420 160 L420 420" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <path d="M560 580 L560 340 L680 340 L680 580" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
          <path d="M80 500 L80 420 L280 420 L280 500 L520 500" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
          <path d="M700 0 L700 180 L800 180" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
          <circle cx="120" cy="150" r="4" fill="rgba(255,255,255,0.18)" />
          <circle cx="340" cy="80" r="3" fill="rgba(255,255,255,0.14)" />
          <circle cx="180" cy="300" r="4" fill="rgba(255,255,255,0.15)" />
          <circle cx="460" cy="200" r="4" fill="rgba(255,255,255,0.12)" />
          <circle cx="420" cy="420" r="5" fill="rgba(255,255,255,0.1)" />
          <circle cx="280" cy="420" r="3" fill="rgba(255,255,255,0.1)" />
        </svg>

        <div className="como-left">
          <span className="section-tag-white">01 — Cómo Trabajamos</span>
          <h2>CÓMO<br />TRABAJAMOS</h2>
          <p>
            Desde que iniciamos nuestra actividad en 2018, buscamos la excelencia
            en cada instalación eléctrica y proyecto de ingeniería que llevamos a cabo.
          </p>
          <button className="btn-ver-mas" onClick={() => navTo('/sobre-nosotros')}>
            VER MÁS →
          </button>
        </div>

        <div className="como-right">
          <div className="circle-container">
            {/* Anillo SVG con rotación acumulada */}
            <svg
              className="circle-ring"
              viewBox="0 0 400 400"
              style={{ transform: `rotate(${rotationAngle}deg)`, transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' }}
            >
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

            {/* Nodos interactivos (posición fija, NO rotan) */}
            {pasos.map((paso, i) => {
              const angle = (i / pasos.length) * 2 * Math.PI - Math.PI / 2;
              const x = 50 + 38.75 * Math.cos(angle);
              const y = 50 + 38.75 * Math.sin(angle);
              return (
                <button
                  key={i}
                  className={`circle-node ${activePaso === i ? 'active' : ''}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => goTo(i)}
                  title={paso.titulo}
                >
                  {PASO_ICONS[i]}
                </button>
              );
            })}

            {/* Centro */}
            <div className="circle-center">
              <span className="paso-label">PASO {activePaso + 1}</span>
              <h3>{pasos[activePaso].titulo}</h3>
              <p>{pasos[activePaso].desc}</p>
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
        <button className="btn-cta-main" onClick={() => navTo('/contacto')}>
          Solicita presupuesto
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <img src="/logo.png" alt="BlueArc Energy" className="footer-logo" />
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
