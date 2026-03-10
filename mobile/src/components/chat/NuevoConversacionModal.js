import { useState, useEffect } from 'react';
import { CircleUserRound, Plus } from 'lucide-react';

function NuevoConversacionModal({ onClose, onCrear, currentUser, showToast, conversaciones = [] }) {
  const [usuarios, setUsuarios] = useState([]);
  const [participanteId, setParticipanteId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');

      const response = await fetch(`${API_URL}/users/empleados-chat`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.users?.filter(u => u.id !== currentUser.id) || []);
      }
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      showToast('Error al cargar empleados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!participanteId) {
      showToast('Selecciona un empleado', 'warning');
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');

      const participantes = [
        { user_id: currentUser.id, tipo_usuario: 'empleado' },
        { user_id: parseInt(participanteId), tipo_usuario: 'empleado' }
      ];

      const response = await fetch(`${API_URL}/chat/conversaciones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipo: 'empleado_empleado', participantes })
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

  const usuariosFiltrados = usuarios.filter(user =>
    !conversaciones.some(
      c => c.tipo === 'empleado_empleado' &&
        c.participantes?.some(p => p.user_id === user.id && p.tipo_usuario === 'empleado')
    )
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo Chat</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label><CircleUserRound size={14} style={{ marginRight: 6 }} />Seleccionar Empleado *</label>
            {loading ? (
              <p style={{ color: '#95a5a6' }}>Cargando empleados...</p>
            ) : usuariosFiltrados.length === 0 ? (
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                No hay empleados disponibles para chatear.
              </p>
            ) : (
              <select
                value={participanteId}
                onChange={(e) => setParticipanteId(e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {usuariosFiltrados.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.nombre} ({user.rol === 'admin' ? 'Administrador' : 'Empleado'})
                  </option>
                ))}
              </select>
            )}
            <small style={{ color: '#7f8c8d', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
              Los grupos de proyecto se crean automáticamente al crear un proyecto.
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={!participanteId || loading}>
              <Plus size={15} /> Crear Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NuevoConversacionModal;
