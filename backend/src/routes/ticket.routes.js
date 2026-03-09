const express = require('express');
const { crearTicket, getTickets, resolverTicket, resetPasswordTicket } = require('../controllers/ticket.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');

const router = express.Router();

// POST /api/tickets - Crear ticket (público)
router.post('/', crearTicket);

// GET /api/tickets - Obtener tickets (admin)
router.get('/', authMiddleware, checkRole('admin'), getTickets);

// PUT /api/tickets/:id/resolver - Resolver ticket (admin)
router.put('/:id/resolver', authMiddleware, checkRole('admin'), resolverTicket);

// POST /api/tickets/:id/reset-password - Resetear contraseña (admin)
router.post('/:id/reset-password', authMiddleware, checkRole('admin'), resetPasswordTicket);

module.exports = router;
