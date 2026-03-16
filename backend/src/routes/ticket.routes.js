const express = require('express');
const { crearTicket, getTickets, getMisTickets, resolverTicket, resetPasswordTicket, crearTicketContacto, crearTicketSolicitud } = require('../controllers/ticket.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');

const router = express.Router();

// POST /api/tickets - Crear ticket de olvido contraseña (público)
router.post('/', crearTicket);

// POST /api/tickets/contacto - Crear ticket desde formulario web (público)
router.post('/contacto', crearTicketContacto);

// POST /api/tickets/solicitud - Crear ticket de solicitud de presupuesto (empleados)
router.post('/solicitud', authMiddleware, crearTicketSolicitud);

// GET /api/tickets/mis-tickets - Tickets propios del empleado autenticado
router.get('/mis-tickets', authMiddleware, getMisTickets);

// GET /api/tickets - Obtener tickets (admin)
router.get('/', authMiddleware, checkRole('admin'), getTickets);

// PUT /api/tickets/:id/resolver - Resolver ticket (admin)
router.put('/:id/resolver', authMiddleware, checkRole('admin'), resolverTicket);

// POST /api/tickets/:id/reset-password - Resetear contraseña (admin)
router.post('/:id/reset-password', authMiddleware, checkRole('admin'), resetPasswordTicket);

module.exports = router;
