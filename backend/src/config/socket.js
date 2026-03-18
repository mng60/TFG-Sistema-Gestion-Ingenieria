const jwt = require('jsonwebtoken');
const Mensaje = require('../models/Mensaje');
const Conversacion = require('../models/Conversacion');

// Mapa de usuarios conectados: userKey -> Set(socketId)
const connectedUsers = new Map();

const getOnlineUserKeys = () => Array.from(connectedUsers.keys());

const addUserConnection = (userKey, socketId) => {
  if (!connectedUsers.has(userKey)) {
    connectedUsers.set(userKey, new Set());
  }
  const sockets = connectedUsers.get(userKey);
  const wasOffline = sockets.size === 0;
  sockets.add(socketId);
  return wasOffline;
};

const removeUserConnection = (userKey, socketId) => {
  const sockets = connectedUsers.get(userKey);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    connectedUsers.delete(userKey);
    return true;
  }
  return false;
};

const initializeSocket = (io) => {
  // Middleware de autenticación para Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Token no proporcionado'));
      }

      // Verificar token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.tipoUsuario = decoded.rol ? 'empleado' : 'cliente';
      socket.userData = decoded;

      next();
    } catch (error) {
      console.error('Error de autenticación Socket.io:', error);
      next(new Error('Autenticación fallida'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.userId} (${socket.tipoUsuario})`);

    // Registrar usuario conectado
    const userKey = `${socket.userId}_${socket.tipoUsuario}`;
    socket.userKey = userKey;

    const becameOnline = addUserConnection(userKey, socket.id);

    // Notificar a otros solo si este usuario pasó de offline a online
    if (becameOnline) {
      socket.broadcast.emit('user_online', {
        userId: socket.userId,
        tipoUsuario: socket.tipoUsuario
      });
    }

    // Enviar al recién conectado la lista actual de online
    socket.emit('online_users', getOnlineUserKeys());

    // Unirse a las conversaciones del usuario
    socket.on('join_conversations', async (conversacionesIds) => {
      try {
        conversacionesIds.forEach(id => {
          socket.join(`conversacion_${id}`);
        });
        console.log(`Usuario ${socket.userId} unido a ${conversacionesIds.length} conversaciones`);
      } catch (error) {
        console.error('Error al unirse a conversaciones:', error);
      }
    });

    // Enviar mensaje
    socket.on('send_message', async (data) => {
      try {
        const { conversacion_id, mensaje, tipo_mensaje = 'texto' } = data;

        // Verificar que el usuario sea participante
        const conversacion = await Conversacion.findById(conversacion_id);
        if (!conversacion) {
          socket.emit('error', { message: 'Conversación no encontrada' });
          return;
        }

        const isParticipante = conversacion.participantes.some(
          p => p.user_id === socket.userId && p.tipo_usuario === socket.tipoUsuario
        );

        if (!isParticipante) {
          socket.emit('error', { message: 'No tienes acceso a esta conversación' });
          return;
        }

        // Guardar mensaje en BD
        const nuevoMensaje = await Mensaje.create({
          conversacion_id,
          user_id: socket.userId,
          tipo_usuario: socket.tipoUsuario,
          mensaje,
          tipo_mensaje
        });

        // Obtener nombre del remitente
        const participante = conversacion.participantes.find(
          p => p.user_id === socket.userId && p.tipo_usuario === socket.tipoUsuario
        );

        const mensajeCompleto = {
          ...nuevoMensaje,
          remitente_nombre: participante?.nombre || 'Usuario'
        };

        // Emitir a todos los participantes de la conversación
        io.to(`conversacion_${conversacion_id}`).emit('new_message', mensajeCompleto);

      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });

    // Usuario escribiendo
    socket.on('typing', (data) => {
      const { conversacion_id, isTyping } = data;
      socket.to(`conversacion_${conversacion_id}`).emit('user_typing', {
        userId: socket.userId,
        tipoUsuario: socket.tipoUsuario,
        conversacion_id,
        isTyping
      });
    });

    // Marcar como leído
    socket.on('mark_read', async (data) => {
      try {
        const { conversacion_id } = data;

        await Conversacion.markAsRead(conversacion_id, socket.userId, socket.tipoUsuario);

        // Notificar a otros participantes
        io.to(`conversacion_${conversacion_id}`).emit('messages_read', {
          conversacion_id,
          user_id: socket.userId,
          tipo_usuario: socket.tipoUsuario,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error al marcar como leído:', error);
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`❌ Usuario desconectado: ${socket.userId} (${socket.tipoUsuario})`);
      const becameOffline = removeUserConnection(socket.userKey, socket.id);

      // Notificar a otros solo si ya no tiene ningún socket activo
      if (becameOffline) {
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          tipoUsuario: socket.tipoUsuario
        });
      }
    });
  });

  // Emitir estado online de usuarios
  const onlineUsersInterval = setInterval(() => {
    io.emit('online_users', getOnlineUserKeys());
  }, 30000);

  // Limpiar al cerrar
  process.on('SIGTERM', () => clearInterval(onlineUsersInterval));
};

module.exports = { initializeSocket, connectedUsers };