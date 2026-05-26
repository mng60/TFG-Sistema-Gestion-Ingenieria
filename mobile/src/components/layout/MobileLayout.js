import React from 'react';
import { WifiOff } from 'lucide-react';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';
import '../../styles/MobileLayout.css';

function MobileLayout({ children, noPadding = false }) {
  const { isOnline } = useAuth();

  return (
    <div className="mobile-layout">
      {!isOnline && (
        <div className="offline-banner">
          <WifiOff size={13} />
          <span>Sin conexión — modo sin red</span>
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
