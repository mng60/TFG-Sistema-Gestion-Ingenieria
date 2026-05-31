const express = require('express');
const { body } = require('express-validator');
const {
  getAllPresupuestos,
  getPresupuestoById,
  getPresupuestosByProyecto,
  createPresupuesto,
  updatePresupuesto,
  deletePresupuesto
} = require('../controllers/presupuesto.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');

const router = express.Router();

// Validaciones para crear/actualizar presupuesto
const presupuestoValidation = [
  body('proyecto_id')
    .notEmpty()
    .withMessage('El proyecto es obligatorio')
    .isInt()
    .withMessage('El proyecto debe ser un ID válido'),
  body('numero_presupuesto')
    .notEmpty()
    .withMessage('El número de presupuesto es obligatorio'),
  body('subtotal')
    .notEmpty()
    .withMessage('El subtotal es obligatorio')
    .isFloat({ min: 0 })
    .withMessage('El subtotal debe ser un número positivo'),
  body('iva')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El IVA debe estar entre 0 y 100'),
  body('estado')
    .optional()
    .isIn(['borrador', 'enviado', 'aceptado', 'rechazado'])
    .withMessage('Estado inválido')
];

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', getAllPresupuestos);
router.get('/proyecto/:proyectoId', getPresupuestosByProyecto);
router.get('/:id', getPresupuestoById);
router.post('/', checkRole('admin'), presupuestoValidation, createPresupuesto);
router.put('/:id', checkRole('admin'), presupuestoValidation, updatePresupuesto);
router.delete('/:id', checkRole('admin'), deletePresupuesto);

module.exports = router;