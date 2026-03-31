const bcrypt = require('bcryptjs');
const Ticket = require('../models/Ticket');
const { pool } = require('../config/database');
const { sendPasswordReset, sendConfirmacionContacto } = require('../utils/emailService');

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

    let emailPersonal = null;
    let nombre = ticket.nombre;

    if (ticket.tipo_usuario === 'empleado') {
      const r = await pool.query(
        'UPDATE users SET password = $1, login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING nombre, email_personal',
        [hashed, ticket.email]
      );
      if (r.rows[0]) { emailPersonal = r.rows[0].email_personal; nombre = r.rows[0].nombre; }
    } else if (ticket.tipo_usuario === 'cliente') {
      const r = await pool.query(
        'UPDATE clientes SET password = $1, login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING nombre_empresa, email_personal',
        [hashed, ticket.email]
      );
      if (r.rows[0]) { emailPersonal = r.rows[0].email_personal; nombre = r.rows[0].nombre_empresa; }
    }

    await Ticket.resolver(id, req.user.id);

    // Enviar nueva contraseña al email personal si está configurado
    sendPasswordReset({ to: emailPersonal, nombre, newPassword, tipoUsuario: ticket.tipo_usuario }).catch(() => {});

    res.json({ success: true, message: 'Contraseña reseteada y ticket resuelto' });
  } catch (error) {
    console.error('Error en resetPasswordTicket:', error);
    res.status(500).json({ success: false, message: 'Error al resetear contraseña', error: error.message });
  }
};

// Crear ticket desde formulario de contacto web (público)
const crearTicketContacto = async (req, res) => {
  try {
    const { nombre, empresa, email, telefono, mensaje, tipo } = req.body;
    if (!nombre || !email || !telefono || !mensaje) {
      return res.status(400).json({ success: false, message: 'Nombre, email, teléfono y mensaje son obligatorios' });
    }
    await Ticket.create({
      tipo: tipo === 'solicitud_nuevo_proyecto' ? 'solicitud_nuevo_proyecto' : 'contacto_web',
      tipo_usuario: 'externo',
      email,
      nombre,
      empresa,
      telefono,
      mensaje
    });
    sendConfirmacionContacto({ to: email, nombre }).catch(() => {});
    res.json({ success: true, message: 'Mensaje recibido. Nos pondremos en contacto contigo en breve.' });
  } catch (error) {
    console.error('Error en crearTicketContacto:', error);
    res.status(500).json({ success: false, message: 'Error al enviar mensaje', error: error.message });
  }
};

// Crear ticket de solicitud de presupuesto (empleados autenticados)
const crearTicketSolicitud = async (req, res) => {
  try {
    const { proyecto_id, mensaje } = req.body;
    if (!proyecto_id) {
      return res.status(400).json({ success: false, message: 'proyecto_id es obligatorio' });
    }
    const ticket = await Ticket.create({
      tipo: 'solicitud_presupuesto',
      tipo_usuario: 'empleado',
      email: req.user.email,
      nombre: req.user.nombre,
      mensaje: mensaje || 'Solicitud de nuevo presupuesto',
      proyecto_id
    });
    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Error en crearTicketSolicitud:', error);
    res.status(500).json({ success: false, message: 'Error al crear solicitud', error: error.message });
  }
};

// Crear ticket de solicitud de nuevo proyecto (cliente autenticado desde portal)
const crearTicketPortal = async (req, res) => {
  try {
    const { tipoProyecto, ubicacion, mensaje } = req.body;
    if (!tipoProyecto || !mensaje) {
      return res.status(400).json({ success: false, message: 'Tipo de proyecto y descripcion son obligatorios' });
    }

    // Obtener datos completos del cliente desde la BD
    const clienteResult = await pool.query(
      'SELECT nombre_empresa, persona_contacto, email, telefono_contacto FROM clientes WHERE id = $1',
      [req.user.id]
    );
    const cliente = clienteResult.rows[0];
    if (!cliente) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

    const mensajeCompleto = [
      `Tipo de proyecto: ${tipoProyecto}`,
      `Ubicacion: ${ubicacion || 'No indicada'}`,
      '',
      mensaje
    ].join('\n');

    const ticket = await Ticket.create({
      tipo: 'solicitud_nuevo_proyecto',
      tipo_usuario: 'cliente',
      email: cliente.email,
      nombre: cliente.persona_contacto || cliente.nombre_empresa,
      empresa: cliente.nombre_empresa,
      telefono: cliente.telefono_contacto || null,
      mensaje: mensajeCompleto
    });

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('Error en crearTicketPortal:', error);
    res.status(500).json({ success: false, message: 'Error al enviar solicitud', error: error.message });
  }
};

// Obtener tickets propios del empleado autenticado
const getMisTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findByEmail(req.user.email);
    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error en getMisTickets:', error);
    res.status(500).json({ success: false, message: 'Error al obtener tickets', error: error.message });
  }
};

module.exports = { crearTicket, getTickets, getMisTickets, resolverTicket, resetPasswordTicket, crearTicketContacto, crearTicketSolicitud, crearTicketPortal, MAX_INTENTOS, LOCK_MINUTOS };
