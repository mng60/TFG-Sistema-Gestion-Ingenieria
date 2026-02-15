import React, { useState } from 'react';
import '../styles/Modal.css';

function ActivarAccesoModal({ cliente, onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    onConfirm(password);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Activar Acceso al Portal</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-description">
            Vas a activar el acceso al portal para <strong>{cliente.nombre_empresa}</strong>
          </p>

          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Contraseña *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetir contraseña"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Activar Acceso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActivarAccesoModal;