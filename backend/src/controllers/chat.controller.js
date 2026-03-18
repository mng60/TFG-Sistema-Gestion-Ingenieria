const Conversacion = require('../models/Conversacion');
const Mensaje = require('../models/Mensaje');

// Obtener conversaciones del usuario autenticado
const getConversaciones = async (req, res) => {
  try {
    const userId = req.user.id;
    const tipoUsuario = req.user.rol ? 'empleado' : 'cliente';

    const conversaciones = await Conversacion.getByUser(userId, tipoUsuario);

    res.json({
      success: true,
      conversaciones
    });
  } catch (error) {
    console.error('Error en getConversaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversaciones',
      error: error.message
    });
  }
};

// Crear nueva conversación
const createConversacion = async (req, res) => {
  try {
    const { tipo, participantes, proyecto_id, nombre } = req.body;
    const usuario = req.user;
    const tipoUsuarioActual = usuario.tipo_usuario || (usuario.rol ? 'empleado' : 'cliente');

    // Validar que el usuario autenticado esté en los participantes
    const userEnParticipantes = participantes.some(
      p => p.user_id === usuario.id && p.tipo_usuario === tipoUsuarioActual
    );

    if (!userEnParticipantes) {
      return res.status(400).json({
        success: false,
        message: 'Debes incluirte como participante'
      });
    }

    // Validar duplicados en conversaciones 1-1
    if (tipo !== 'proyecto_grupo' && participantes.length === 2) {
      const [p1, p2] = participantes;
      const existente = await Conversacion.findBetweenUsers(
        p1.user_id, p1.tipo_usuario,
        p2.user_id, p2.tipo_usuario
      );

      if (existente) {
        // Devolver la conversación existente con datos completos
        const conversacionCompleta = await Conversacion.findById(existente.id);
        return res.status(200).json({
          success: true,
          conversacion: conversacionCompleta,
          message: 'Ya existe una conversación con este usuario'
        });
      }
    }

    // Crear conversación
    const nuevaConversacion = await Conversacion.create({
      tipo,
      proyecto_id: proyecto_id || null,
      nombre: nombre || null,
      participantes
    });

    // Obtener la conversación completa con datos de participantes
    const conversacionCompleta = await Conversacion.findById(nuevaConversacion.id);

    res.status(201).json({
      success: true,
      conversacion: conversacionCompleta
    });

  } catch (error) {
    console.error('Error al crear conversación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear conversación',
      error: error.message
    });
  }
};

// Obtener mensajes de una conversación
const getMensajes = async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verificar que el usuario sea participante
    const userId = req.user.id;
    const tipoUsuario = req.user.rol ? 'empleado' : 'cliente';

    const conversacion = await Conversacion.findById(conversacionId);
    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    const isParticipante = conversacion.participantes.some(
      p => p.user_id === userId && p.tipo_usuario === tipoUsuario
    );

    if (!isParticipante) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    const mensajes = await Mensaje.getByConversacion(
      conversacionId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      mensajes,
      count: mensajes.length
    });
  } catch (error) {
    console.error('Error en getMensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes',
      error: error.message
    });
  }
};

// Enviar mensaje (POST)
const sendMensaje = async (req, res) => {
  try {
    const { conversacion_id, mensaje, tipo_mensaje = 'texto' } = req.body;

    const userId = req.user.id;
    const tipoUsuario = req.user.rol ? 'empleado' : 'cliente';

    // Verificar que sea participante
    const conversacion = await Conversacion.findById(conversacion_id);
    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    const isParticipante = conversacion.participantes.some(
      p => p.user_id === userId && p.tipo_usuario === tipoUsuario
    );

    if (!isParticipante) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    // Crear mensaje
    const nuevoMensaje = await Mensaje.create({
      conversacion_id,
      user_id: userId,
      tipo_usuario: tipoUsuario,
      mensaje,
      tipo_mensaje
    });

    res.status(201).json({
      success: true,
      mensaje: nuevoMensaje
    });
  } catch (error) {
    console.error('Error en sendMensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar mensaje',
      error: error.message
    });
  }
};

// Marcar conversación como leída
const markAsRead = async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const userId = req.user.id;
    const tipoUsuario = req.user.rol ? 'empleado' : 'cliente';

    await Conversacion.markAsRead(conversacionId, userId, tipoUsuario);

    res.json({
      success: true,
      message: 'Conversación marcada como leída'
    });
  } catch (error) {
    console.error('Error en markAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar como leída',
      error: error.message
    });
  }
};

// Obtener detalles de conversación
const getConversacionById = async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const userId = req.user.id;
    const tipoUsuario = req.user.rol ? 'empleado' : 'cliente';

    const conversacion = await Conversacion.findById(conversacionId);

    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    const isParticipante = conversacion.participantes.some(
      p => p.user_id === userId && p.tipo_usuario === tipoUsuario
    );

    if (!isParticipante) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    res.json({
      success: true,
      conversacion
    });
  } catch (error) {
    console.error('Error en getConversacionById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversación',
      error: error.message
    });
  }
};

module.exports = {
  getConversaciones,
  createConversacion,
  getMensajes,
  sendMensaje,
  markAsRead,
  getConversacionById
};