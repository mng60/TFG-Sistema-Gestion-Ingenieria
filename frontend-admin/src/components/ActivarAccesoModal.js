import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/Modal.css';

function ActivarAccesoModal({ cliente, onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

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
            <div style={{ position: 'relative' }}>
              <input
                type={showPass1 ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                autoFocus
                style={{ width: '100%', paddingRight: 38, boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPass1(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7f8c8d', padding: 0, display: 'flex' }}>
                {showPass1 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass2 ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetir contraseña"
                required
                style={{ width: '100%', paddingRight: 38, boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPass2(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7f8c8d', padding: 0, display: 'flex' }}>
                {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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