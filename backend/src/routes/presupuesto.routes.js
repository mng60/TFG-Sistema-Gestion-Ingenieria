const express = require('express');
const { body } = require('express-validator');
const {
  getAllPresupuestos,
  getPresupuestoById,
  getPresupuestosByProyecto,
  createPresupuesto,
  updatePresupuesto,
  aceptarPresupuesto,
  rechazarPresupuesto,
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

// GET /api/presupuestos - Obtener todos los presupuestos
router.get('/', getAllPresupuestos);

// GET /api/presupuestos/proyecto/:proyectoId - Obtener presupuestos de un proyecto
router.get('/proyecto/:proyectoId', getPresupuestosByProyecto);

// GET /api/presupuestos/:id - Obtener un presupuesto por ID
router.get('/:id', getPresupuestoById);

// POST /api/presupuestos - Crear presupuesto (solo admin)
router.post('/', checkRole('admin'), presupuestoValidation, createPresupuesto);

// PUT /api/presupuestos/:id - Actualizar presupuesto (solo admin)
router.put('/:id', checkRole('admin'), presupuestoValidation, updatePresupuesto);

// PATCH /api/presupuestos/:id/aceptar - Aceptar presupuesto (solo admin)
router.patch('/:id/aceptar', checkRole('admin'), aceptarPresupuesto);

// PATCH /api/presupuestos/:id/rechazar - Rechazar presupuesto (solo admin)
router.patch('/:id/rechazar', checkRole('admin'), rechazarPresupuesto);

// DELETE /api/presupuestos/:id - Eliminar presupuesto (solo admin)
router.delete('/:id', checkRole('admin'), deletePresupuesto);

module.exports = router;