const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword
} = require('../controllers/user.controller');
const User = require('../models/User');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');

const router = express.Router();

// Validaciones
const createUserValidation = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es obligatoria'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Accesible a todos los empleados autenticados, no solo admin (necesario para el chat)
router.get('/empleados-chat', async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error en empleados-chat:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener empleados',
      error: error.message
    });
  }
});

router.get('/', checkRole('admin'), getAllUsers);
router.get('/:id', getUserById);
router.post('/', checkRole('admin'), createUserValidation, createUser);
router.put('/:id', updateUser);
router.delete('/:id', checkRole('admin'), deleteUser);
router.put('/:id/password', updatePasswordValidation, updatePassword);

module.exports = router;