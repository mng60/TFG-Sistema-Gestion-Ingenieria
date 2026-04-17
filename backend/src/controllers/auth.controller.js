const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// Registrar nuevo usuario
const register = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol: rol || 'empleado',
      telefono
    });

    // Generar token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      rol: newUser.rol
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
        telefono: newUser.telefono
      }
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

const MAX_INTENTOS = 5;
const LOCK_MINUTOS = 15;

// Login de usuario
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { pool } = require('../config/database');

    // Buscar usuario por email (SELECT * para tener login_attempts y locked_until)
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Comprobar bloqueo
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutos = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Cuenta bloqueada por demasiados intentos. Inténtalo en ${minutos} min o solicita un reset de contraseña.`,
        bloqueado: true
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const intentos = (user.login_attempts || 0) + 1;
      const bloqueado = intentos >= MAX_INTENTOS;
      await pool.query(
        `UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3`,
        [intentos, bloqueado ? new Date(Date.now() + LOCK_MINUTOS * 60000) : null, user.id]
      );
      const restantes = MAX_INTENTOS - intentos;
      return res.status(401).json({
        success: false,
        message: bloqueado
          ? `Cuenta bloqueada ${LOCK_MINUTOS} min por demasiados intentos. Solicita un reset de contraseña.`
          : `Credenciales inválidas. ${restantes} intento${restantes !== 1 ? 's' : ''} restante${restantes !== 1 ? 's' : ''}.`,
        bloqueado
      });
    }

    // Login correcto — resetear intentos
    await pool.query('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);

    const token = generateToken({ id: user.id, email: user.email, rol: user.rol });

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        foto_url: user.foto_url || null
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: error.message });
  }
};

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    // req.user viene del middleware de autenticación
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        foto_url: user.foto_url || null,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({ success: false, message: 'Error al obtener perfil', error: error.message });
  }
};

// Actualizar perfil propio (nombre, telefono)
const updateProfile = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }
    const updated = await User.updatePerfil(req.user.id, { nombre: nombre.trim(), telefono });
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error en updateProfile:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar perfil', error: error.message });
  }
};

// Cambiar contraseña propia
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByEmail(req.user.email);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ success: false, message: 'Contraseña actual incorrecta' });

    const hashed = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await User.updatePassword(req.user.id, hashed);
    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar contraseña', error: error.message });
  }
};

// Subir/actualizar foto de perfil
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });

    // Borrar avatar anterior de Cloudinary si existe
    const current = await User.findById(req.user.id);
    if (current?.foto_url?.startsWith('https://res.cloudinary.com')) {
      const match = current.foto_url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
      if (match) {
        const cloudinary = require('cloudinary').v2;
        cloudinary.uploader.destroy(match[1]).catch(() => {});
      }
    }

    const fotoUrl = req.file.path?.startsWith('http') ? req.file.path : `/uploads/avatares/${req.file.filename}`;
    const updated = await User.updateFoto(req.user.id, fotoUrl);
    res.json({ success: true, foto_url: fotoUrl, user: updated });
  } catch (error) {
    console.error('Error en uploadAvatar:', error);
    res.status(500).json({ success: false, message: 'Error al subir foto', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar
};