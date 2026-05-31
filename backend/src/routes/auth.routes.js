const express = require('express');
const { body } = require('express-validator');
const { login, getProfile, updateProfile, changePassword, uploadAvatar } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { uploadAvatares } = require('../config/multer');

const router = express.Router();

// Validaciones para login
const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

router.post('/login', loginValidation, login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);

router.post('/profile/foto', authMiddleware, (req, res, next) => {
  uploadAvatares.single('foto')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, uploadAvatar);

module.exports = router;