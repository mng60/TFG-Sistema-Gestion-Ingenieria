import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import axios from 'axios';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/GestionPages.css';
import { TicketCheck, KeyRound, CheckCheck, Clock } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ResetPasswordModal({ ticket, onClose, onSuccess, showToast }) {
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return showToast('Mínimo 6 caracteres', 'error');
    setSaving(true);
    try {
      const token = localStorage.getItem('empleado_token');
      await axios.post(`${API_URL}/tickets/${ticket.id}/reset-password`, { newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Contraseña reseteada y ticket resuelto', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al resetear', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Resetear contraseña</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-description">
            Usuario: <strong>{ticket.email}</strong> ({ticket.tipo_usuario})
          </p>
          <div className="form-group">
            <label>Nueva contraseña *</label>
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              autoFocus
            />
          </div>
          <p style={{ fontSize: '0.82rem', color: '#e67e22', marginTop: -8 }}>
            ⚠️ Comparte esta contraseña con el usuario de forma segura.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <KeyRound size={15} /> {saving ? 'Guardando...' : 'Resetear y resolver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Tickets() {
  const { isAdmin } = useEmpleadoAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);  // solo carga inicial
  const [filtro, setFiltro] = useState('pendiente');
  const [resetModal, setResetModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState(null);

  // Carga inicial con spinner
  useEffect(() => {
    if (!isAdmin()) return;
    setLoading(true);
    fetchTickets(filtro).finally(() => setLoading(false));
  }, []);

  // Cambio de filtro: refresh silencioso
  useEffect(() => {
    if (!isAdmin()) return;
    fetchTickets(filtro);
  }, [filtro]);

  const fetchTickets = async (f) => {
    try {
      const token = localStorage.getItem('empleado_token');
      const params = f !== 'todos' ? `?estado=${f}` : '';
      const res = await axios.get(`${API_URL}/tickets${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data.tickets || []);
    } catch {
      showToast('Error al cargar tickets', 'error');
    }
  };

  const cargarTickets = () => fetchTickets(filtro);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleResolver = (ticket) => {
    setConfirmModal({
      title: 'Resolver ticket',
      message: `¿Marcar como resuelto el ticket de "${ticket.email}"?`,
      type: 'info',
      confirmText: 'Resolver',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('empleado_token');
          await axios.put(`${API_URL}/tickets/${ticket.id}/resolver`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast('Ticket resuelto', 'success');
          cargarTickets();
        } catch {
          showToast('Error al resolver ticket', 'error');
        }
      }
    });
  };

  const formatFecha = (f) => {
    if (!f) return '-';
    return new Date(f).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const pendientes = tickets.filter(t => t.estado === 'pendiente').length;

  if (!isAdmin()) {
    return <AdminLayout><p style={{ padding: 24 }}>Acceso solo para administradores.</p></AdminLayout>;
  }

  return (
    <AdminLayout>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10, fontWeight: 600,
          background: toast.type === 'success' ? '#d4edda' : '#f8d7da',
          color: toast.type === 'success' ? '#155724' : '#721c24',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toast.message}
        </div>
      )}

      <header className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TicketCheck size={26} color="#4DB6A8" /> Tickets de Soporte
            {pendientes > 0 && (
              <span style={{ background: '#e74c3c', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 700 }}>
                {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p>Solicitudes de recuperación de contraseña y soporte</p>
        </div>
      </header>

      {/* Filtros */}
      <div className="filters-bar" style={{ marginBottom: 20 }}>
        {['pendiente', 'resuelto', 'todos'].map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              background: filtro === f ? '#4DB6A8' : '#f0f0f0',
              color: filtro === f ? 'white' : '#2c3e50'
            }}
          >
            {f === 'pendiente' ? '🔴 Pendientes' : f === 'resuelto' ? '✅ Resueltos' : 'Todos'}
          </button>
        ))}
      </div>

      <div className="content-card">
        {loading ? (
          <div className="loading-container"><div className="spinner"></div><p>Cargando tickets...</p></div>
        ) : tickets.length === 0 ? (
          <p className="empty-message">No hay tickets {filtro !== 'todos' ? filtro + 's' : ''}</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Mensaje</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  {filtro !== 'resuelto' && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                        background: ticket.tipo_usuario === 'empleado' ? '#eaf4fb' : '#fef3e2',
                        color: ticket.tipo_usuario === 'empleado' ? '#2980b9' : '#e67e22'
                      }}>
                        {ticket.tipo_usuario === 'empleado' ? 'Empleado' : 'Cliente'}
                      </span>
                    </td>
                    <td>{ticket.email}</td>
                    <td>{ticket.nombre || '-'}</td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.mensaje || '-'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>{formatFecha(ticket.created_at)}</td>
                    <td>
                      {ticket.estado === 'pendiente' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#e67e22', fontWeight: 600, fontSize: '0.85rem' }}>
                          <Clock size={13} /> Pendiente
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#27ae60', fontWeight: 600, fontSize: '0.85rem' }}>
                          <CheckCheck size={13} /> Resuelto
                          {ticket.resuelto_por_nombre && <span style={{ color: '#7f8c8d', fontWeight: 400 }}> · {ticket.resuelto_por_nombre}</span>}
                        </span>
                      )}
                    </td>
                    {filtro !== 'resuelto' && (
                      <td>
                        {ticket.estado === 'pendiente' && (
                          <div className="action-buttons">
                            <button
                              className="btn-sm btn-primary"
                              onClick={() => setResetModal(ticket)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="Resetear contraseña"
                            >
                              <KeyRound size={13} /> Resetear pwd
                            </button>
                            <button
                              className="btn-sm btn-edit"
                              onClick={() => handleResolver(ticket)}
                              title="Marcar como resuelto"
                            >
                              ✓ Resolver
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resetModal && (
        <ResetPasswordModal
          ticket={resetModal}
          onClose={() => setResetModal(null)}
          onSuccess={() => { setResetModal(null); cargarTickets(); }}
          showToast={showToast}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </AdminLayout>
  );
}

export default Tickets;
