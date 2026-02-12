const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Validaciones para registro
const registerValidation = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validaciones para login
const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', registerValidation, register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', loginValidation, login);

// GET /api/auth/profile - Obtener perfil (ruta protegida)
router.get('/profile', authMiddleware, getProfile);

module.exports = router;