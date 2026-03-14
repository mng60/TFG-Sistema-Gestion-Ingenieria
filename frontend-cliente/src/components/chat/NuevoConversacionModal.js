import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

function NuevoConversacionModal({ onClose, onCrear, currentUser, showToast, conversaciones = [] }) {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarEmpleados = useCallback(async () => {
    try {
      const proyectosRes = await api.get('/portal/proyectos');
      const proyectos = proyectosRes.data.proyectos || [];

      const empleadosPorProyecto = await Promise.all(
        proyectos.map(async (p) => {
          try {
            const res = await api.get(`/portal/proyectos/${p.id}/empleados`);
            return (res.data.empleados || []).map((e) => ({ ...e, proyecto_nombre: p.nombre }));
          } catch {
            return [];
          }
        })
      );

      const todos = empleadosPorProyecto.flat();
      const uniqueMap = new Map();

      todos.forEach((e) => {
        if (!uniqueMap.has(e.id)) uniqueMap.set(e.id, e);
      });

      setEmpleados(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      showToast('Error al cargar empleados', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargarEmpleados();
  }, [cargarEmpleados]);

  const empleadosDisponibles = useMemo(() => {
    return empleados.filter((emp) => !conversaciones.some(
      (c) => c.tipo === 'empleado_cliente'
        && c.participantes?.some((p) => p.user_id === emp.id && p.tipo_usuario === 'empleado')
    ));
  }, [conversaciones, empleados]);

  const empleadoSeleccionado = useMemo(() => {
    return empleadosDisponibles.find((emp) => String(emp.id) === String(empleadoId)) || null;
  }, [empleadoId, empleadosDisponibles]);

  const formatearOpcionEmpleado = (emp) => {
    const rol = emp.rol_proyecto || emp.rol || 'Empleado';
    const base = `${emp.nombre} - ${rol}`;
    return base.length > 52 ? `${base.slice(0, 49)}...` : base;
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
        { user_id: parseInt(empleadoId, 10), tipo_usuario: 'empleado' }
      ];

      const response = await fetch(`${API_URL}/chat/conversaciones`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipo: 'empleado_cliente', participantes })
      });

      const data = await response.json();

      if (data.success) {
        onCrear(data.conversacion);
      } else {
        showToast(data.message || 'Error al crear conversacion', 'error');
        onClose();
      }
    } catch (error) {
      console.error('Error al crear conversacion:', error);
      showToast('Error al crear conversacion', 'error');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuevo chat</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Seleccionar empleado *</label>

            {loading ? (
              <p className="modal-note">Cargando empleados...</p>
            ) : empleados.length === 0 ? (
              <p className="modal-empty">No tienes empleados asignados en tus proyectos.</p>
            ) : empleadosDisponibles.length === 0 ? (
              <p className="modal-note">Ya tienes un chat abierto con todos los empleados disponibles.</p>
            ) : (
              <select
                className="modal-select"
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                required
              >
                <option value="">Seleccionar empleado...</option>
                {empleadosDisponibles.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {formatearOpcionEmpleado(emp)}
                  </option>
                ))}
              </select>
            )}

            {empleadoSeleccionado?.proyecto_nombre && (
              <div className="selected-employee-note">
                Proyecto: {empleadoSeleccionado.proyecto_nombre}
              </div>
            )}

            <small className="modal-helper">
              Solo puedes chatear con empleados asignados a tus proyectos.
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!empleadoId || loading || empleadosDisponibles.length === 0}
            >
              Iniciar chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NuevoConversacionModal;
