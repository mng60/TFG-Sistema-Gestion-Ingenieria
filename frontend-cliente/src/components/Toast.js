import React, { useEffect } from 'react';

const BG = {
  success: { background: '#4caf50', color: 'white' },
  error:   { background: '#f44336', color: 'white' },
  warning: { background: '#ff9800', color: 'white' },
  info:    { background: '#2196f3', color: 'white' },
};

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      padding: '12px 20px',
      borderRadius: 10,
      fontWeight: 600,
      zIndex: 9999,
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      ...(BG[type] || BG.success)
    }}>
      {message}
    </div>
  );
}

export default Toast;
