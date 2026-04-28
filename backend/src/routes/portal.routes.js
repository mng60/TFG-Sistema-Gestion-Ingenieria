const express = require('express');
const { body } = require('express-validator');
const {
  loginCliente,
  getPerfilCliente,
  updatePerfilCliente,
  uploadAvatarCliente,
  getMisProyectos,
  cambiarPasswordCliente,
  getMisPresupuestos,
  getPresupuestoDetalle,
  aceptarMiPresupuesto,
  rechazarMiPresupuesto,
  getMisDocumentos,
  descargarMiDocumento,
  getEmpleadosProyecto,
  getActualizacionesProyecto
} = require('../controllers/cliente.auth.controller');
const { crearTicketPortal, getMisTickets } = require('../controllers/ticket.controller');
const { uploadAvatares } = require('../config/multer');

const router = express.Router();

// Middleware de autenticación específico para clientes
const authClienteMiddleware = (req, res, next) => {
  const authMiddleware = require('../middlewares/auth.middleware');
  
  // Usar el middleware normal de autenticación
  authMiddleware(req, res, () => {
    // Verificar que el token es de tipo "cliente"
    if (req.user.tipo !== 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Acceso solo para clientes'
      });
    }
    next();
  });
};

// Validaciones
const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

const cambiarPasswordValidation = [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es obligatoria'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

// Rutas públicas (sin autenticación)
// POST /api/portal/login - Login de cliente
router.post('/login', loginValidation, loginCliente);

// Rutas protegidas (requieren token de cliente)
// GET /api/portal/perfil - Obtener perfil del cliente autenticado
router.get('/perfil', authClienteMiddleware, getPerfilCliente);

// PUT /api/portal/perfil - Actualizar perfil del cliente
router.put('/perfil', authClienteMiddleware, updatePerfilCliente);

// POST /api/portal/perfil/foto - Subir foto de perfil
router.post('/perfil/foto', authClienteMiddleware, (req, res, next) => {
  uploadAvatares.single('foto')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, uploadAvatarCliente);

// GET /api/portal/proyectos - Obtener proyectos del cliente autenticado
router.get('/proyectos', authClienteMiddleware, getMisProyectos);

// PUT /api/portal/cambiar-password - Cambiar contraseña
router.put('/cambiar-password', authClienteMiddleware, cambiarPasswordValidation, cambiarPasswordCliente);

// GET /api/portal/presupuestos - Obtener presupuestos del cliente
router.get('/presupuestos', authClienteMiddleware, getMisPresupuestos);

// GET /api/portal/presupuestos/:id/aceptar - Aceptar presupuesto (ANTES de presupuestos/:id)
router.patch('/presupuestos/:id/aceptar', authClienteMiddleware, aceptarMiPresupuesto);
router.patch('/presupuestos/:id/rechazar', authClienteMiddleware, rechazarMiPresupuesto);

// GET /api/portal/presupuestos/:id - Obtener detalle de un presupuesto
router.get('/presupuestos/:id', authClienteMiddleware, getPresupuestoDetalle);

// GET /api/portal/documentos/:id/download - Descargar documento (ANTES de documentos/:id si existiera)
router.get('/documentos/:id/download', authClienteMiddleware, descargarMiDocumento);

// GET /api/portal/documentos - Obtener documentos públicos del cliente
router.get('/documentos', authClienteMiddleware, getMisDocumentos);

// GET /api/portal/proyectos/:id/empleados - Empleados asignados al proyecto (para iniciar chat)
router.get('/proyectos/:id/empleados', authClienteMiddleware, getEmpleadosProyecto);

// GET /api/portal/proyectos/:proyectoId/actualizaciones - Actualizaciones del proyecto (read-only)
router.get('/proyectos/:proyectoId/actualizaciones', authClienteMiddleware, getActualizacionesProyecto);

// GET /api/portal/tickets - Ver solicitudes propias del cliente
router.get('/tickets', authClienteMiddleware, getMisTickets);

// POST /api/portal/tickets - Solicitar nuevo proyecto (cliente autenticado)
router.post('/tickets', authClienteMiddleware, crearTicketPortal);

module.exports = router;