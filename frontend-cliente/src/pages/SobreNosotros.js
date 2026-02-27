import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNav from '../components/LandingNav';
import '../styles/Landing.css';
import '../styles/SobreNosotros.css';

const servicios = [
  { icon: '⚡', title: 'Instalaciones Eléctricas', desc: 'Diseño e instalación de sistemas eléctricos de baja y alta tensión para industria, comercio y vivienda. Cumplimiento total del REBT.' },
  { icon: '📐', title: 'Proyectos de Ingeniería', desc: 'Redacción de proyectos técnicos completos: memoria, cálculos, planos y presupuesto. Dirección facultativa de obra.' },
  { icon: '🏭', title: 'Mantenimiento Industrial', desc: 'Contratos de mantenimiento preventivo y correctivo. Revisiones periódicas, termografía y ensayos de instalaciones.' },
  { icon: '☀️', title: 'Energías Renovables', desc: 'Diseño e instalación de plantas solares fotovoltaicas. Gestión de trámites administrativos y conexión a red.' },
  { icon: '🔌', title: 'Automatización', desc: 'Cuadros de automatización, PLCs, variadores de frecuencia y sistemas SCADA para procesos industriales.' },
  { icon: '🏠', title: 'Domótica', desc: 'Instalaciones inteligentes para viviendas y edificios: gestión de iluminación, climatización y seguridad.' },
];

function SobreNosotros() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <LandingNav />

      {/* Hero de página */}
      <div className="page-hero">
        <div className="page-hero-inner">
          <span className="section-tag-white">02 — Sobre Nosotros</span>
          <h1>QUIÉNES<br />SOMOS</h1>
        </div>
      </div>

      {/* Quiénes somos */}
      <section className="sn-section sn-intro">
        <div className="sn-intro-text">
          <span className="section-tag">Nuestra Historia</span>
          <h2>MÁS DE 15 AÑOS<br />DE EXPERIENCIA</h2>
          <p>
            BlueArc Energy nació en 2018 de la mano de un equipo de ingenieros eléctricos
            con una visión clara: ofrecer soluciones energéticas integrales con el más alto nivel
            técnico y un trato cercano al cliente.
          </p>
          <p>
            Desde nuestros inicios hemos ejecutado más de 500 proyectos en toda España,
            abarcando desde instalaciones residenciales hasta grandes plantas industriales
            y parques fotovoltaicos de varios megavatios.
          </p>
          <p>
            Nuestro equipo está formado por ingenieros colegiados, técnicos certificados
            y personal de obra especializado, todos comprometidos con la excelencia y la seguridad.
          </p>
        </div>
        <div className="sn-intro-visual">
          <div className="sn-intro-img" />
          <div className="sn-intro-stats">
            <div className="sn-stat"><span>+500</span><label>Proyectos</label></div>
            <div className="sn-stat"><span>15</span><label>Años</label></div>
            <div className="sn-stat"><span>98%</span><label>Satisfacción</label></div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="sn-section sn-servicios">
        <div className="sn-section-header">
          <span className="section-tag">Nuestros Servicios</span>
          <h2>LO QUE<br />HACEMOS</h2>
        </div>
        <div className="sn-servicios-grid">
          {servicios.map((s, i) => (
            <div key={i} className="sn-servicio-card">
              <div className="sn-servicio-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Valores */}
      <section className="sn-section sn-valores-section">
        <div className="sn-section-header">
          <span className="section-tag light">Nuestros Valores</span>
          <h2>LO QUE NOS<br />DEFINE</h2>
        </div>
        <div className="sn-valores-list">
          {[
            { n: '01', t: 'Seguridad ante todo', d: 'Cada instalación se ejecuta bajo estrictos protocolos de seguridad y normativa vigente. No hay proyecto que valga más que la vida.' },
            { n: '02', t: 'Transparencia total', d: 'Presupuestos cerrados, sin sorpresas. Informamos al cliente en cada fase del proyecto con total honestidad.' },
            { n: '03', t: 'Innovación continua', d: 'Nos actualizamos permanentemente en nuevas tecnologías: domótica, fotovoltaica, eficiencia energética y digitalización.' },
            { n: '04', t: 'Compromiso duradero', d: 'La relación con el cliente no termina al finalizar la obra. Ofrecemos soporte técnico y mantenimiento a largo plazo.' },
          ].map(v => (
            <div key={v.n} className="sn-valor-row">
              <span className="sn-valor-n">{v.n}</span>
              <h3>{v.t}</h3>
              <p>{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-cta">
        <h2>¿HABLAMOS DE<br />TU PROYECTO?</h2>
        <p>Contacta con nosotros y te respondemos en menos de 24 horas.</p>
        <button className="btn-cta-main" onClick={() => navigate('/contacto')}>
          Contactar ahora
        </button>
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

export default SobreNosotros;
