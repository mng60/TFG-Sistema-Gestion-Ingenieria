const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendBienvenidaEmpleado } = require('../utils/emailService');

// Obtener todos los usuarios (solo admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// Obtener un usuario por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// Crear usuario (solo admin)
const createUser = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, email_personal } = req.body;

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
      telefono,
      email_personal
    });

    const destinoEmail = email_personal || email;
    sendBienvenidaEmpleado({
      to: destinoEmail,
      emailLogin: email,
      nombre,
      password,
      rol: rol || 'empleado',
      adminUrl: process.env.ADMIN_URL || null
    }).catch((err) => console.error('[EMAIL] Error enviando bienvenida a empleado:', err.message));

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser
    });
  } catch (error) {
    console.error('Error en createUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

// Actualizar usuario (admin puede actualizar cualquiera, usuario solo a sí mismo)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, rol, email_personal } = req.body;

    // Verificar permisos: admin puede actualizar a cualquiera, usuario solo a sí mismo
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este usuario'
      });
    }

    // Si no es admin, no puede cambiar el rol
    const updateData = {
      nombre,
      email,
      telefono,
      email_personal,
      ...(req.user.rol === 'admin' && { rol })
    };

    const updatedUser = await User.update(id, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// Eliminar usuario (solo admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir que el admin se elimine a sí mismo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    // Proteger cuenta de testing principal
    const target = await User.findById(id);
    if (target?.email === 'miguel@test.com') {
      return res.status(403).json({
        success: false,
        message: 'Este usuario está protegido y no puede eliminarse'
      });
    }

    const deletedUser = await User.delete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

// Actualizar contraseña (usuario puede cambiar su propia contraseña)
const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Solo puede cambiar su propia contraseña
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar esta contraseña'
      });
    }

    // Obtener usuario con contraseña
    const user = await User.findByEmail(req.user.email);

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    await User.updatePassword(id, hashedPassword);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en updatePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar contraseña',
      error: error.message
    });
  }
};

const testEmail = async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ success: false, message: 'Falta el campo "to"' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.json({ success: false, message: 'RESEND_API_KEY no configurado en Railway' });
  }

  try {
    const { Resend } = require('resend');
    const r = new Resend(apiKey);
    const from = process.env.EMAIL_FROM || 'BlueArc Ingeniería <onboarding@resend.dev>';
    const { data, error } = await r.emails.send({
      from,
      to: [to],
      subject: 'Test email — BlueArc Ingeniería',
      html: '<p>Test desde Railway con Resend. ¡Funciona!</p>'
    });

    if (error) {
      return res.status(500).json({ success: false, message: error.message, from });
    }
    res.json({ success: true, message: `Enviado con id: ${data.id}`, from });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updatePassword,
  testEmail
};