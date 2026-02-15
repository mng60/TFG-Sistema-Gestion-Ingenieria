import React from 'react';
import '../styles/Modal.css';

function ConfirmModal({ 
  title, 
  message, 
  type = 'danger', // 'danger', 'warning', 'info'
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm, 
  onClose 
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header modal-header-${type}`}>
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-form">
          <p className="modal-description">
            {message}
          </p>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
            <button 
              type="button" 
              className={`btn-${type}`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;