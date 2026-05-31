const express = require('express');
const { crearTicket, getTickets, getMisTickets, resolverTicket, resetPasswordTicket, crearTicketContacto, crearTicketSolicitud } = require('../controllers/ticket.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');

const router = express.Router();

router.post('/', crearTicket);
router.post('/contacto', crearTicketContacto);
router.post('/solicitud', authMiddleware, crearTicketSolicitud);
router.get('/mis-tickets', authMiddleware, getMisTickets);
router.get('/', authMiddleware, checkRole('admin'), getTickets);
router.put('/:id/resolver', authMiddleware, checkRole('admin'), resolverTicket);
router.post('/:id/reset-password', authMiddleware, checkRole('admin'), resetPasswordTicket);

module.exports = router;
