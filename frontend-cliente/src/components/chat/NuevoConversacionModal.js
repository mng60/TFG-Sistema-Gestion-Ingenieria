import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// Modal para que el cliente inicie un chat 1-1 con un empleado de sus proyectos
function NuevoConversacionModal({ onClose, onCrear, currentUser, showToast }) {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      // Cargar todos los proyectos del cliente
      const proyectosRes = await api.get('/portal/proyectos');
      const proyectos = proyectosRes.data.proyectos || [];

      // Para cada proyecto, cargar los empleados asignados
      const empleadosPorProyecto = await Promise.all(
        proyectos.map(async (p) => {
          try {
            const res = await api.get(`/portal/proyectos/${p.id}/empleados`);
            return (res.data.empleados || []).map(e => ({ ...e, proyecto_nombre: p.nombre }));
          } catch {
            return [];
          }
        })
      );

      // Deduplicar por id de empleado (puede estar en varios proyectos)
      const todos = empleadosPorProyecto.flat();
      const uniqueMap = new Map();
      todos.forEach(e => {
        if (!uniqueMap.has(e.id)) uniqueMap.set(e.id, e);
      });

      setEmpleados(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      showToast('Error al cargar empleados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!empleadoId) {
      showToast('Selecciona un empleado', 'warning');
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');

      const participantes = [
        { user_id: currentUser.id, tipo_usuario: 'cliente' },
        { user_id: parseInt(empleadoId), tipo_usuario: 'empleado' }
      ];

      const response = await fetch(`${API_URL}/chat/conversaciones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipo: 'empleado_cliente', participantes })
      });

      const data = await response.json();

      if (data.success) {
        onCrear(data.conversacion);
      } else {
        showToast(data.message || 'Error al crear conversación', 'error');
        onClose();
      }
    } catch (error) {
      console.error('Error al crear conversación:', error);
      showToast('Error al crear conversación', 'error');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo Chat</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Seleccionar empleado *</label>
            {loading ? (
              <p style={{ color: '#95a5a6' }}>Cargando empleados...</p>
            ) : empleados.length === 0 ? (
              <p style={{ color: '#e74c3c', fontSize: '0.9rem' }}>
                No tienes empleados asignados en tus proyectos.
              </p>
            ) : (
              <select
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                required
              >
                <option value="">Seleccionar empleado...</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} — {emp.rol_proyecto || emp.rol}
                    {emp.proyecto_nombre ? ` (${emp.proyecto_nombre})` : ''}
                  </option>
                ))}
              </select>
            )}
            <small style={{ color: '#7f8c8d', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
              Solo puedes chatear con empleados asignados a tus proyectos.
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={!empleadoId || loading}>
              Iniciar Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NuevoConversacionModal;
