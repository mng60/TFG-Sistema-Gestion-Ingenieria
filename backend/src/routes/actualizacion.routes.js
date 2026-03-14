const express = require('express');
const { getActualizaciones, createActualizacion, deleteActualizacion } = require('../controllers/actualizacion.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router({ mergeParams: true });

// GET /api/proyectos/:id/actualizaciones
router.get('/', authMiddleware, getActualizaciones);

// POST /api/proyectos/:id/actualizaciones
router.post('/', authMiddleware, createActualizacion);

// DELETE /api/proyectos/:id/actualizaciones/:actId
router.delete('/:actId', authMiddleware, deleteActualizacion);

module.exports = router;
