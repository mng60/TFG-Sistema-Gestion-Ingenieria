import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BriefcaseBusiness,
  CheckCheck,
  Clock,
  Globe,
  KeyRound,
  Mail,
  Phone,
  TicketCheck,
  UserRound
} from 'lucide-react';
import AdminLayout from '../components/Layout/AdminLayout';
import { useEmpleadoAuth } from '../context/EmpleadoAuthContext';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/GestionPages.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getTicketTipoNormalizado(ticket) {
  const mensaje = (ticket?.mensaje || '').toLowerCase();
  if (
    ticket?.tipo === 'solicitud_nuevo_proyecto' ||
    mensaje.includes('solicitud de proyecto desde portal cliente')
  ) {
    return 'solicitud_nuevo_proyecto';
  }
  return ticket?.tipo || 'olvido_password';
}

function getTipoBadge(ticket) {
  const tipo = getTicketTipoNormalizado(ticket);

  if (tipo === 'solicitud_nuevo_proyecto') {
    return {
      bg: '#e0f7f4',
      color: '#0f766e',
      label: 'Nuevo proyecto',
      icon: <BriefcaseBusiness size={12} />
    };
  }

  if (tipo === 'contacto_web') {
    return {
      bg: '#f3e8ff',
      color: '#7c3aed',
      label: 'Web',
      icon: <Globe size={12} />
    };
  }

  if (tipo === 'solicitud_presupuesto') {
    return {
      bg: '#e0f2fe',
      color: '#0369a1',
      label: 'Presupuesto',
      icon: <TicketCheck size={12} />
    };
  }

  return {
    bg: ticket?.tipo_usuario === 'empleado' ? '#eaf4fb' : '#fef3e2',
    color: ticket?.tipo_usuario === 'empleado' ? '#2980b9' : '#e67e22',
    label: ticket?.tipo_usuario === 'empleado' ? 'Empleado' : 'Cliente',
    icon: <UserRound size={12} />
  };
}

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function ResetPasswordModal({ ticket, onClose, onSuccess, showToast }) {
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Minimo 6 caracteres', 'error');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('empleado_token');
      await axios.post(
        `${API_URL}/tickets/${ticket.id}/reset-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Contrasena restablecida y ticket resuelto', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al resetear', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reactivar acceso</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-description">
            Se generara una nueva contrasena para <strong>{ticket.email}</strong>.
          </p>
          <div className="form-group">
            <label>Nueva contrasena *</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              required
              autoFocus
            />
          </div>
          <p style={{ fontSize: '0.82rem', color: '#e67e22', marginTop: -8 }}>
            Comparte la nueva contrasena por el canal acordado con el cliente.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <KeyRound size={15} /> {saving ? 'Guardando...' : 'Reactivar y resolver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TicketDetailModal({ ticket, onClose, onResolve, onResetPassword }) {
  const tipoBadge = getTipoBadge(ticket);
  const tipoNormalizado = getTicketTipoNormalizado(ticket);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h2>Detalle del ticket</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="modal-form">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: '0.82rem',
                fontWeight: 700,
                background: tipoBadge.bg,
                color: tipoBadge.color
              }}
            >
              {tipoBadge.icon}
              {tipoBadge.label}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: '0.82rem',
                fontWeight: 700,
                background: ticket.estado === 'pendiente' ? '#fff4e8' : '#e8f8ef',
                color: ticket.estado === 'pendiente' ? '#d9822b' : '#1f9d5a'
              }}
            >
              {ticket.estado === 'pendiente' ? <Clock size={13} /> : <CheckCheck size={13} />}
              {ticket.estado}
            </span>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Email</label>
              <div className="modal-description" style={{ marginBottom: 0 }}>
                <Mail size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                {ticket.email}
              </div>
            </div>

            <div className="form-group">
              <label>Nombre</label>
              <div className="modal-description" style={{ marginBottom: 0 }}>
                {ticket.nombre || '-'}
              </div>
            </div>

            <div className="form-group">
              <label>Telefono</label>
              <div className="modal-description" style={{ marginBottom: 0 }}>
                {ticket.telefono ? (
                  <>
                    <Phone size={15} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                    {ticket.telefono}
                  </>
                ) : '-'}
              </div>
            </div>

            <div className="form-group">
              <label>Empresa / proyecto</label>
              <div className="modal-description" style={{ marginBottom: 0 }}>
                {ticket.empresa || ticket.proyecto_nombre || '-'}
              </div>
            </div>

            <div className="form-group form-group-full">
              <label>Fecha</label>
              <div className="modal-description" style={{ marginBottom: 0 }}>
                {formatFecha(ticket.created_at)}
              </div>
            </div>

            <div className="form-group form-group-full">
              <label>Mensaje completo</label>
              <div
                style={{
                  border: '1px solid #e0e6ea',
                  background: '#f8fbfc',
                  borderRadius: 10,
                  padding: 16,
                  minHeight: 140,
                  whiteSpace: 'pre-wrap',
                  color: '#2c3e50',
                  lineHeight: 1.6
                }}
              >
                {ticket.mensaje || '-'}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            {ticket.estado === 'pendiente' && onResolve && (
              tipoNormalizado === 'olvido_password' ? (
                <button type="button" className="btn-primary" onClick={onResetPassword}>
                  <KeyRound size={15} /> Reactivar y resolver
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={onResolve}>
                  <CheckCheck size={15} /> Marcar resuelto
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tickets() {
  const { isAdmin } = useEmpleadoAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendiente');
  const [resetModal, setResetModal] = useState(null);
  const [detalleTicket, setDetalleTicket] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchTickets = async (estado) => {
    try {
      const token = localStorage.getItem('empleado_token');
      const params = estado !== 'todos' ? `?estado=${estado}` : '';
      const res = await axios.get(`${API_URL}/tickets${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data.tickets || []);
    } catch {
      showToast('Error al cargar tickets', 'error');
    }
  };

  const fetchMisTickets = async () => {
    try {
      const token = localStorage.getItem('empleado_token');
      const res = await axios.get(`${API_URL}/tickets/mis-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data.tickets || []);
    } catch {
      showToast('Error al cargar tus solicitudes', 'error');
    }
  };

  useEffect(() => {
    setLoading(true);
    const load = isAdmin() ? fetchTickets(filtro) : fetchMisTickets();
    load.finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAdmin()) return;
    fetchTickets(filtro);
  }, [filtro]);

  const cargarTickets = () => isAdmin() ? fetchTickets(filtro) : fetchMisTickets();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const pendientes = useMemo(
    () => tickets.filter((ticket) => ticket.estado === 'pendiente').length,
    [tickets]
  );

  const handleResolver = (ticket) => {
    setConfirmModal({
      title: 'Resolver ticket',
      message: `Marcar como resuelto el ticket de "${ticket.email}"?`,
      type: 'info',
      confirmText: 'Resolver',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('empleado_token');
          await axios.put(
            `${API_URL}/tickets/${ticket.id}/resolver`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setDetalleTicket(null);
          showToast('Ticket resuelto', 'success');
          cargarTickets();
        } catch {
          showToast('Error al resolver ticket', 'error');
        }
      }
    });
  };

  const ticketTable = (showActions) => (
    <div className="content-card">
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      ) : tickets.length === 0 ? (
        <p className="empty-message">No hay solicitudes {!isAdmin() || filtro !== 'todos' ? '' : ''}</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                {showActions && <th>Email</th>}
                {showActions && <th>Nombre</th>}
                {!showActions && <th>Proyecto</th>}
                <th>Mensaje</th>
                <th>Fecha</th>
                <th>Estado</th>
                {showActions && filtro !== 'resuelto' && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const badge = getTipoBadge(ticket);
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => setDetalleTicket(ticket)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: badge.bg,
                          color: badge.color
                        }}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>
                    {showActions && (
                      <td>
                        <div>{ticket.email}</div>
                        {ticket.empresa && (
                          <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>{ticket.empresa}</div>
                        )}
                        {ticket.telefono && (
                          <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>{ticket.telefono}</div>
                        )}
                      </td>
                    )}
                    {showActions && <td>{ticket.nombre || '-'}</td>}
                    {!showActions && (
                      <td style={{ color: '#2c3e50' }}>{ticket.proyecto_nombre || ticket.empresa || '-'}</td>
                    )}
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          {ticket.resuelto_por_nombre && (
                            <span style={{ color: '#7f8c8d', fontWeight: 400 }}> · {ticket.resuelto_por_nombre}</span>
                          )}
                        </span>
                      )}
                    </td>
                    {showActions && filtro !== 'resuelto' && (
                      <td onClick={(e) => e.stopPropagation()}>
                        {ticket.estado === 'pendiente' && (
                          <div className="action-buttons">
                            {getTicketTipoNormalizado(ticket) === 'olvido_password' ? (
                              <button
                                className="btn-sm btn-edit"
                                onClick={() => setResetModal(ticket)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                title="Reactivar acceso y resolver"
                              >
                                <KeyRound size={13} /> Resolver
                              </button>
                            ) : (
                              <button
                                className="btn-sm btn-edit"
                                onClick={() => handleResolver(ticket)}
                                title="Marcar como resuelto"
                              >
                                ✓ Resolver
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 10,
            fontWeight: 600,
            background: toast.type === 'success' ? '#d4edda' : '#f8d7da',
            color: toast.type === 'success' ? '#155724' : '#721c24',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {toast.message}
        </div>
      )}

      <header className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TicketCheck size={26} color="#4DB6A8" />
            {isAdmin() ? 'Tickets de Soporte' : 'Mis solicitudes'}
            {isAdmin() && pendientes > 0 && (
              <span
                style={{
                  background: '#e74c3c',
                  color: 'white',
                  borderRadius: 20,
                  padding: '2px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p>
            {isAdmin()
              ? 'Solicitudes de acceso, nuevos proyectos y mensajes recibidos desde la web.'
              : 'Historial de solicitudes que has enviado al administrador.'}
          </p>
        </div>
      </header>

      {isAdmin() && (
        <div className="filters-bar" style={{ marginBottom: 20 }}>
          {['pendiente', 'resuelto', 'todos'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltro(estado)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: filtro === estado ? '#4DB6A8' : '#f0f0f0',
                color: filtro === estado ? 'white' : '#2c3e50'
              }}
            >
              {estado === 'pendiente' ? 'Pendientes' : estado === 'resuelto' ? 'Resueltos' : 'Todos'}
            </button>
          ))}
        </div>
      )}

      {ticketTable(isAdmin())}

      {detalleTicket && (
        <TicketDetailModal
          ticket={detalleTicket}
          onClose={() => setDetalleTicket(null)}
          onResolve={isAdmin() ? () => handleResolver(detalleTicket) : undefined}
          onResetPassword={isAdmin() ? () => {
            setDetalleTicket(null);
            setResetModal(detalleTicket);
          } : undefined}
        />
      )}

      {resetModal && (
        <ResetPasswordModal
          ticket={resetModal}
          onClose={() => setResetModal(null)}
          onSuccess={() => {
            setResetModal(null);
            cargarTickets();
          }}
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
