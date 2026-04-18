import React, { useEffect, useState } from 'react';
import '../styles/InAppNotificationBanner.css';

function InAppNotificationBanner({ notification, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notification) return;
    setVisible(true);
    const timer = setTimeout(() => dismiss(), 4500);
    return () => clearTimeout(timer);
  }, [notification]);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 300);
  };

  if (!notification) return null;

  return (
    <div className={`in-app-banner${visible ? ' in-app-banner--visible' : ''}`} onClick={dismiss}>
      <div className="in-app-banner__content">
        <div className="in-app-banner__icon">💬</div>
        <div className="in-app-banner__text">
          {notification.title && (
            <div className="in-app-banner__title">{notification.title}</div>
          )}
          {notification.body && (
            <div className="in-app-banner__body">{notification.body}</div>
          )}
        </div>
        <button
          className="in-app-banner__close"
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default InAppNotificationBanner;
