import React, { useEffect, useState } from 'react';
import '../styles/SplashScreen.css';

function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFading(true), 2000);
    const timer2 = setTimeout(() => onDone(), 2500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onDone]);

  return (
    <div className={`splash-screen ${fading ? 'splash-fade-out' : ''}`}>
      <div className="splash-logo">
        <img src="/logo.png" alt="BlueArc" />
      </div>
      <h1 className="splash-name">BlueArc</h1>
      <p className="splash-tagline">Sistema de Gestión de Ingeniería</p>
      <div className="splash-dots">
        <span /><span /><span />
      </div>
    </div>
  );
}

export default SplashScreen;
