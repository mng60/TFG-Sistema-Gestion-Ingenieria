const express = require('express');
const Proyecto = require('../models/Proyecto');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// GET /api/dashboard - Datos del dashboard filtrados por rol
router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await Proyecto.getDashboardData(req.user.id, req.user.rol);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ success: false, message: 'Error al cargar el dashboard', error: error.message });
  }
});

module.exports = router;
