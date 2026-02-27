const express = require('express');
const {
  getConversaciones,
  createConversacion,
  getMensajes,
  sendMensaje,
  markAsRead,
  getConversacionById
} = require('../controllers/chat.controller');
const authAnyMiddleware = require('../middlewares/authAny.middleware');
const Conversacion = require('../models/Conversacion');
const Mensaje = require('../models/Mensaje');
const { uploadChat } = require('../config/multer');

const router = express.Router();

// Todas las rutas requieren autenticación (empleados y clientes del portal)
router.use(authAnyMiddleware);

// GET /api/chat/conversaciones - Obtener conversaciones del usuario
router.get('/conversaciones', getConversaciones);

// POST /api/chat/conversaciones - Crear nueva conversación
router.post('/conversaciones', createConversacion);

// GET /api/chat/conversaciones/:conversacionId - Obtener detalles de conversación
router.get('/conversaciones/:conversacionId', getConversacionById);

// GET /api/chat/mensajes/:conversacionId - Obtener mensajes de una conversación
router.get('/mensajes/:conversacionId', getMensajes);

// POST /api/chat/mensajes - Enviar mensaje
router.post('/mensajes', sendMensaje);

// PUT /api/chat/conversaciones/:conversacionId/read - Marcar como leído
router.put('/conversaciones/:conversacionId/read', markAsRead);

// GET /api/chat/info-participante/:userId/:tipoUsuario - Obtener info completa del participante
router.get('/info-participante/:userId/:tipoUsuario', async (req, res) => {
  try {
    const { userId, tipoUsuario } = req.params;
    const empleado = req.user;
    const pool = require('../config/database').pool;

    let infoParticipante = {
      telefono: null,
      grupos_comunes: []
    };

    // Obtener teléfono según tipo de usuario
    if (tipoUsuario === 'cliente') {
      const clienteQuery = await pool.query(
        'SELECT telefono_contacto FROM clientes WHERE id = $1',
        [userId]
      );
      if (clienteQuery.rows.length > 0) {
        infoParticipante.telefono = clienteQuery.rows[0].telefono_contacto || clienteQuery.rows[0].telefono;
      }
    } else if (tipoUsuario === 'empleado') {
      const empleadoQuery = await pool.query(
        'SELECT telefono FROM users WHERE id = $1',
        [userId]
      );
      if (empleadoQuery.rows.length > 0) {
        infoParticipante.telefono = empleadoQuery.rows[0].telefono;
      }
    }

    // Obtener grupos en común
    const gruposQuery = `
      SELECT DISTINCT c.id, c.nombre, c.tipo,
        (SELECT COUNT(*) FROM conversacion_participantes WHERE conversacion_id = c.id) as participantes_count
      FROM conversaciones c
      INNER JOIN conversacion_participantes cp1 ON c.id = cp1.conversacion_id
      INNER JOIN conversacion_participantes cp2 ON c.id = cp2.conversacion_id
      WHERE c.tipo = 'proyecto_grupo'
        AND cp1.user_id = $1 AND cp1.tipo_usuario = 'empleado'
        AND cp2.user_id = $2 AND cp2.tipo_usuario = $3
    `;

    const gruposResult = await pool.query(gruposQuery, [empleado.id, userId, tipoUsuario]);
    infoParticipante.grupos_comunes = gruposResult.rows;

    res.json({
      success: true,
      data: infoParticipante
    });

  } catch (error) {
    console.error('Error al obtener info del participante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del participante'
    });
  }
});

// DELETE /api/chat/conversaciones/:conversacionId - Eliminar conversación
router.delete('/conversaciones/:conversacionId', async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const usuario = req.user;
    const pool = require('../config/database').pool;

    // Verificar que la conversación existe
    const conversacionQuery = await pool.query(
      'SELECT * FROM conversaciones WHERE id = $1',
      [conversacionId]
    );

    if (conversacionQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    // Verificar que el usuario es participante (empleado o cliente)
    const participanteQuery = await pool.query(
      'SELECT * FROM conversacion_participantes WHERE conversacion_id = $1 AND user_id = $2 AND tipo_usuario = $3',
      [conversacionId, usuario.id, usuario.tipo_usuario]
    );

    if (participanteQuery.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta conversación'
      });
    }

    // Eliminar conversación (CASCADE eliminará mensajes y participantes automáticamente)
    await pool.query('DELETE FROM conversaciones WHERE id = $1', [conversacionId]);

    console.log(`✅ Conversación ${conversacionId} eliminada por ${usuario.tipo_usuario} ${usuario.id}`);

    res.json({
      success: true,
      message: 'Conversación eliminada correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar conversación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la conversación'
    });
  }
});

// GET /api/chat/conversaciones/:conversacionId/archivos - Obtener archivos compartidos
router.get('/conversaciones/:conversacionId/archivos', async (req, res) => {
  try {
    const { conversacionId } = req.params;
    const usuario = req.user;
    const pool = require('../config/database').pool;

    // Verificar que el usuario es participante (empleado o cliente)
    const participanteQuery = await pool.query(
      'SELECT * FROM conversacion_participantes WHERE conversacion_id = $1 AND user_id = $2 AND tipo_usuario = $3',
      [conversacionId, usuario.id, usuario.tipo_usuario]
    );

    if (participanteQuery.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    // Obtener archivos (imágenes, documentos, audio)
    const archivosQuery = `
      SELECT 
        m.id,
        m.tipo_mensaje,
        m.archivo_url,
        m.archivo_nombre,
        m.archivo_tipo,
        m.created_at,
        m.user_id,
        m.tipo_usuario,
        CASE 
          WHEN m.tipo_usuario = 'empleado' THEN u.nombre
          WHEN m.tipo_usuario = 'cliente' THEN COALESCE(cl.persona_contacto, cl.nombre_empresa)
        END as usuario_nombre
      FROM mensajes m
      LEFT JOIN users u ON m.user_id = u.id AND m.tipo_usuario = 'empleado'
      LEFT JOIN clientes cl ON m.user_id = cl.id AND m.tipo_usuario = 'cliente'
      WHERE m.conversacion_id = $1 
        AND m.tipo_mensaje IN ('archivo', 'imagen', 'audio')
        AND m.archivo_url IS NOT NULL
        AND m.is_deleted = FALSE
      ORDER BY m.created_at DESC
    `;

    const result = await pool.query(archivosQuery, [conversacionId]);

    // Agrupar por tipo
    const archivos = {
      imagenes: result.rows.filter(r => r.tipo_mensaje === 'imagen'),
      documentos: result.rows.filter(r => r.tipo_mensaje === 'archivo'),
      audios: result.rows.filter(r => r.tipo_mensaje === 'audio')
    };

    res.json({
      success: true,
      archivos,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener archivos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener archivos'
    });
  }
});

// POST /api/chat/upload - Subir archivo al chat
router.post('/upload', (req, res, next) => {
  uploadChat.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { conversacion_id, tipo_mensaje } = req.body;
    const usuario = req.user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      });
    }

    console.log('📎 Archivo recibido:', {
      nombre: file.originalname,
      tipo: file.mimetype,
      tamaño: file.size,
      conversacion: conversacion_id
    });

    // Verificar que el usuario es participante (empleado o cliente)
    const conversacion = await Conversacion.findById(conversacion_id);
    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: 'Conversación no encontrada'
      });
    }

    const isParticipante = conversacion.participantes.some(
      p => p.user_id === usuario.id && p.tipo_usuario === usuario.tipo_usuario
    );

    if (!isParticipante) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta conversación'
      });
    }

    // Construir URL del archivo
    const archivo_url = `/uploads/chat/${file.filename}`;

    // Crear mensaje en BD
    const nuevoMensaje = await Mensaje.create({
      conversacion_id,
      user_id: usuario.id,
      tipo_usuario: usuario.tipo_usuario,
      mensaje: file.originalname,
      tipo_mensaje,
      archivo_url,
      archivo_nombre: file.originalname,
      archivo_tipo: file.mimetype
    });

    // Obtener nombre del remitente
    const participante = conversacion.participantes.find(
      p => p.user_id === usuario.id && p.tipo_usuario === usuario.tipo_usuario
    );

    const mensajeCompleto = {
      ...nuevoMensaje,
      remitente_nombre: participante?.nombre || 'Usuario'
    };

    // Emitir via Socket.io
    const io = req.app.get('io');
    io.to(`conversacion_${conversacion_id}`).emit('new_message', mensajeCompleto);

    console.log(`✅ Archivo subido: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);

    res.json({
      success: true,
      message: 'Archivo subido correctamente',
      mensaje: mensajeCompleto
    });

  } catch (error) {
    console.error('❌ Error al subir archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir el archivo',
      error: error.message
    });
  }
});

module.exports = router;