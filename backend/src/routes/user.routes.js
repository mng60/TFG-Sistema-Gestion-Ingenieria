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

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get('/', checkRole('admin'), getAllUsers);

// GET /api/users/:id - Obtener un usuario por ID
router.get('/:id', getUserById);

// POST /api/users - Crear usuario (solo admin)
router.post('/', checkRole('admin'), createUserValidation, createUser);

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', updateUser);

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id', checkRole('admin'), deleteUser);

// PUT /api/users/:id/password - Actualizar contraseña
router.put('/:id/password', updatePasswordValidation, updatePassword);

module.exports = router;