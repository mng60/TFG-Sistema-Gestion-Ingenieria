const express = require('express');
const { body } = require('express-validator');
const {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deactivateCliente,
  deleteCliente,
  getClienteProyectos
} = require('../controllers/cliente.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');

const router = express.Router();

// Validaciones para crear/actualizar cliente
const clienteValidation = [
  body('nombre_empresa')
    .notEmpty()
    .withMessage('El nombre de la empresa es obligatorio'),
  body('cif')
    .notEmpty()
    .withMessage('El CIF es obligatorio')
    .matches(/^[A-Z0-9]{9}$/)
    .withMessage('El CIF debe tener formato válido (9 caracteres alfanuméricos)'),
  body('email')
    .isEmail()
    .withMessage('Email inválido'),
  body('telefono')
    .optional()
    .matches(/^[0-9]{9}$/)
    .withMessage('El teléfono debe tener 9 dígitos')
];

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/clientes - Obtener todos los clientes
router.get('/', getAllClientes);

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', getClienteById);

// GET /api/clientes/:id/proyectos - Obtener proyectos de un cliente
router.get('/:id/proyectos', getClienteProyectos);

// POST /api/clientes - Crear cliente (solo admin)
router.post('/', checkRole('admin'), clienteValidation, createCliente);

// PUT /api/clientes/:id - Actualizar cliente (solo admin)
router.put('/:id', checkRole('admin'), clienteValidation, updateCliente);

// PATCH /api/clientes/:id/deactivate - Desactivar cliente (solo admin)
router.patch('/:id/deactivate', checkRole('admin'), deactivateCliente);

// DELETE /api/clientes/:id - Eliminar cliente (solo admin)
router.delete('/:id', checkRole('admin'), deleteCliente);

const { activarAccesoCliente } = require('../controllers/cliente.auth.controller');

// Validación para activar acceso
const activarAccesoValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// POST /api/clientes/:id/activar-acceso - Activar acceso al portal (solo admin)
router.post('/:id/activar-acceso', checkRole('admin'), activarAccesoValidation, activarAccesoCliente);

module.exports = router;