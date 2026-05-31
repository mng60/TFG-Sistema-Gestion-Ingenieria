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

router.get('/', getAllClientes);
router.get('/:id', getClienteById);
router.get('/:id/proyectos', getClienteProyectos);
router.post('/', checkRole('admin'), clienteValidation, createCliente);
router.put('/:id', checkRole('admin'), clienteValidation, updateCliente);
router.patch('/:id/deactivate', checkRole('admin'), deactivateCliente);
router.delete('/:id', checkRole('admin'), deleteCliente);

const { activarAccesoCliente } = require('../controllers/cliente.auth.controller');

// Validación para activar acceso
const activarAccesoValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

router.post('/:id/activar-acceso', checkRole('admin'), activarAccesoValidation, activarAccesoCliente);


module.exports = router;