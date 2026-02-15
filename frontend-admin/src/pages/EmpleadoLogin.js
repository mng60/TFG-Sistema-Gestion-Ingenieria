import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import '../styles/Login.css';

function EmpleadoLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useEmpleadoAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Panel Interno - Login';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Panel Interno</h1>
          <p>Sistema de Gestión - Empleados</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="empleado@empresa.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Acceder al Sistema'}
          </button>
        </form>

        <div className="login-footer">
          <p><small>Panel administrativo de gestión interna</small></p>
        </div>
      </div>
    </div>
  );
}

export default EmpleadoLogin;