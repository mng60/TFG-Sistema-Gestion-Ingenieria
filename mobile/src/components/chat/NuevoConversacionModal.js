import React, { useState, useEffect } from 'react';
import clienteService from '../../services/clienteService';
import usuarioService from '../../services/usuarioService';
import proyectoService from '../../services/proyectoService';

function NuevoConversacionModal({ onClose, onCrear, currentUser, showToast }) {
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [tipo, setTipo] = useState('empleado_cliente');
  const [participanteId, setParticipanteId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');
      const isAdmin = currentUser.rol === 'admin';

      if (isAdmin) {
        const [clientesData, usuariosData] = await Promise.all([
          clienteService.getAll({ activo: true }),
          usuarioService.getAll()
        ]);

        setClientes(clientesData.clientes || []);
        setUsuarios(usuariosData.users?.filter(u => u.id !== currentUser.id) || []);
      } else {
        const proyectosData = await proyectoService.getAll();
        const proyectosEmpleado = proyectosData.proyectos || [];

        const clienteIdsUnicos = [...new Set(proyectosEmpleado.map(p => p.cliente_id).filter(Boolean))];

        if (clienteIdsUnicos.length > 0) {
          const clientesPromises = clienteIdsUnicos.map(async (id) => {
            try {
              const cliente = await clienteService.getById(id);
              return cliente.success ? cliente.cliente : null;
            } catch {
              return null;
            }
          });

          const clientesResults = await Promise.all(clientesPromises);
          setClientes(clientesResults.filter(c => c !== null));
        } else {
          setClientes([]);
        }

        try {
          const response = await fetch(`${API_URL}/users/empleados-chat`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            setUsuarios(data.users?.filter(u => u.id !== currentUser.id) || []);
          } else {
            setUsuarios([]);
          }
        } catch (error) {
          console.error('Error al cargar empleados:', error);
          setUsuarios([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!participanteId) {
      showToast('Selecciona un participante', 'warning');
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
      const token = localStorage.getItem('empleado_token');

      const participantes = [
        { user_id: currentUser.id, tipo_usuario: 'empleado' },
        {
          user_id: parseInt(participanteId),
          tipo_usuario: tipo === 'empleado_cliente' ? 'cliente' : 'empleado'
        }
      ];

      const response = await fetch(`${API_URL}/chat/conversaciones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipo, participantes })
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
            <label>Tipo de Conversación *</label>
            <select
              value={tipo}
              onChange={(e) => { setTipo(e.target.value); setParticipanteId(''); }}
              required
            >
              <option value="empleado_cliente">💬 Chat con Cliente</option>
              <option value="empleado_empleado">👥 Chat con Empleado</option>
            </select>
            <small style={{ color: '#7f8c8d', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
              Los grupos de proyecto se crean automáticamente al crear un proyecto.
            </small>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#95a5a6' }}>Cargando...</p>
          ) : (
            <div className="form-group">
              <label>
                {tipo === 'empleado_cliente' ? 'Seleccionar Cliente *' : 'Seleccionar Empleado *'}
              </label>
              <select
                value={participanteId}
                onChange={(e) => setParticipanteId(e.target.value)}
                required
              >
                <option value="">Seleccionar...</option>
                {tipo === 'empleado_cliente'
                  ? clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre_empresa} - {cliente.nombre_contacto}
                      </option>
                    ))
                  : usuarios.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.nombre} ({user.rol})
                      </option>
                    ))
                }
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={!participanteId}>
              Crear Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NuevoConversacionModal;
