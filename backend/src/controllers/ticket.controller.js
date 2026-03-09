const bcrypt = require('bcryptjs');
const Ticket = require('../models/Ticket');
const { pool } = require('../config/database');

const MAX_INTENTOS = 5;
const LOCK_MINUTOS = 15;

// Crear ticket (público — no requiere autenticación)
const crearTicket = async (req, res) => {
  try {
    const { tipo_usuario, email, nombre, mensaje } = req.body;
    if (!tipo_usuario || !email) {
      return res.status(400).json({ success: false, message: 'Email y tipo de usuario son obligatorios' });
    }

    // Verificar que el email existe para ese tipo de usuario
    let existe = false;
    if (tipo_usuario === 'empleado') {
      const r = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      existe = r.rows.length > 0;
    } else if (tipo_usuario === 'cliente') {
      const r = await pool.query('SELECT id FROM clientes WHERE email = $1', [email]);
      existe = r.rows.length > 0;
    }

    // Respondemos igual aunque no exista (seguridad)
    if (existe) {
      await Ticket.create({ tipo_usuario, email, nombre, mensaje });
    }

    res.json({ success: true, message: 'Solicitud enviada. El administrador se pondrá en contacto contigo.' });
  } catch (error) {
    console.error('Error en crearTicket:', error);
    res.status(500).json({ success: false, message: 'Error al crear ticket', error: error.message });
  }
};

// Obtener todos los tickets (solo admin)
const getTickets = async (req, res) => {
  try {
    const { estado } = req.query;
    const tickets = await Ticket.findAll(estado ? { estado } : {});
    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error en getTickets:', error);
    res.status(500).json({ success: false, message: 'Error al obtener tickets', error: error.message });
  }
};

// Resolver ticket (solo admin)
const resolverTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.resolver(id, req.user.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Error en resolverTicket:', error);
    res.status(500).json({ success: false, message: 'Error al resolver ticket', error: error.message });
  }
};

// Resetear contraseña desde ticket (solo admin)
const resetPasswordTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener el ticket
    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    const ticket = ticketResult.rows[0];
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket no encontrado' });

    const hashed = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));

    if (ticket.tipo_usuario === 'empleado') {
      await pool.query(
        'UPDATE users SET password = $1, login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
        [hashed, ticket.email]
      );
    } else if (ticket.tipo_usuario === 'cliente') {
      await pool.query(
        'UPDATE clientes SET password = $1, login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
        [hashed, ticket.email]
      );
    }

    await Ticket.resolver(id, req.user.id);
    res.json({ success: true, message: 'Contraseña reseteada y ticket resuelto' });
  } catch (error) {
    console.error('Error en resetPasswordTicket:', error);
    res.status(500).json({ success: false, message: 'Error al resetear contraseña', error: error.message });
  }
};

module.exports = { crearTicket, getTickets, resolverTicket, resetPasswordTicket, MAX_INTENTOS, LOCK_MINUTOS };
