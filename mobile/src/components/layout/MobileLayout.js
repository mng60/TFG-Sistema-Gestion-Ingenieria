import React from 'react';
import BottomNav from './BottomNav';
import '../../styles/MobileLayout.css';

function MobileLayout({ children, noPadding = false }) {
  return (
    <div className="mobile-layout">
      <main className={`mobile-main${noPadding ? ' no-padding' : ''}`}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default MobileLayout;
