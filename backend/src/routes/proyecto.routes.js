const express = require('express');
const { body } = require('express-validator');
const {
  getAllProyectos,
  getProyectoById,
  createProyecto,
  updateProyecto,
  deleteProyecto,
  asignarEmpleado,
  desasignarEmpleado,
  getProyectoEmpleados,
  getEstadisticas
} = require('../controllers/proyecto.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');

const router = express.Router();

// Validaciones para crear/actualizar proyecto
const proyectoValidation = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre del proyecto es obligatorio'),
  body('cliente_id')
    .notEmpty()
    .withMessage('El cliente es obligatorio')
    .isInt()
    .withMessage('El cliente debe ser un ID válido'),
  body('estado')
    .optional()
    .isIn(['pendiente', 'en_progreso', 'pausado', 'completado', 'cancelado'])
    .withMessage('Estado inválido'),
  body('prioridad')
    .optional()
    .isIn(['baja', 'media', 'alta', 'urgente'])
    .withMessage('Prioridad inválida')
];

// Validación para asignar empleado
const asignarEmpleadoValidation = [
  body('user_id')
    .notEmpty()
    .withMessage('El empleado es obligatorio')
    .isInt()
    .withMessage('El empleado debe ser un ID válido'),
  body('rol_proyecto')
    .optional()
    .isString()
    .withMessage('El rol en el proyecto debe ser un texto')
];

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/proyectos/estadisticas - Obtener estadísticas
router.get('/estadisticas', getEstadisticas);

// GET /api/proyectos - Obtener todos los proyectos
router.get('/', getAllProyectos);

// GET /api/proyectos/:id - Obtener un proyecto por ID
router.get('/:id', getProyectoById);

// GET /api/proyectos/:id/empleados - Obtener empleados del proyecto
router.get('/:id/empleados', getProyectoEmpleados);

// POST /api/proyectos - Crear proyecto (solo admin)
router.post('/', checkRole('admin'), proyectoValidation, createProyecto);

// POST /api/proyectos/:id/empleados - Asignar empleado (solo admin)
router.post('/:id/empleados', checkRole('admin'), asignarEmpleadoValidation, asignarEmpleado);

// PUT /api/proyectos/:id - Actualizar proyecto (solo admin)
router.put('/:id', checkRole('admin'), proyectoValidation, updateProyecto);

// DELETE /api/proyectos/:id/empleados/:userId - Desasignar empleado (solo admin)
router.delete('/:id/empleados/:userId', checkRole('admin'), desasignarEmpleado);

// DELETE /api/proyectos/:id - Eliminar proyecto (solo admin)
router.delete('/:id', checkRole('admin'), deleteProyecto);

module.exports = router;