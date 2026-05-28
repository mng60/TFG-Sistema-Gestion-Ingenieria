import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import '../../styles/MobileLayout.css';

const BANNER_FULL_HEIGHT = '34px';
const BANNER_COLLAPSED_HEIGHT = '3px';
const COLLAPSE_DELAY_MS = 5000;

function MobileLayout({ children, noPadding = false }) {
  const { isOnline } = useAuth();
  const [bannerCollapsed, setBannerCollapsed] = useState(false);

  // Auto-colapsa el banner a una franja fina tras 5 segundos sin conexión
  useEffect(() => {
    if (!isOnline) {
      setBannerCollapsed(false);
      const timer = setTimeout(() => setBannerCollapsed(true), COLLAPSE_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
      setBannerCollapsed(false);
    }
  }, [isOnline]);

  // Sincroniza las variables CSS en :root para que los portales (ej. InfoPanel)
  // ajusten su posición correctamente
  useEffect(() => {
    const height = !isOnline
      ? (bannerCollapsed ? BANNER_COLLAPSED_HEIGHT : BANNER_FULL_HEIGHT)
      : BANNER_FULL_HEIGHT;
    document.documentElement.style.setProperty('--offline-banner-height', height);
    document.documentElement.style.setProperty(
      '--offline-banner-offset',
      !isOnline ? 'var(--offline-banner-height)' : '0px'
    );
  }, [isOnline, bannerCollapsed]);

  return (
    <div className={`mobile-layout${!isOnline ? ' mobile-layout--offline' : ''}`}>
      {!isOnline && (
        <div
          className={`offline-banner${bannerCollapsed ? ' collapsed' : ''}`}
          role="status"
          aria-live="polite"
        >
          <WifiOff size={13} />
          <span>Sin conexión — sin acceso a red</span>
        </div>
      )}
      <main className={`mobile-main${noPadding ? ' no-padding' : ''}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default MobileLayout;
