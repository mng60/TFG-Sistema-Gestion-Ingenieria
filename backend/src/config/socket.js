const jwt = require('jsonwebtoken');
const Mensaje = require('../models/Mensaje');
const Conversacion = require('../models/Conversacion');
const { sendChatPush } = require('../services/pushNotificationService');

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
  // Middleware de autenticacion para Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Token no proporcionado'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.tipoUsuario = decoded.rol ? 'empleado' : 'cliente';
      socket.userData = decoded;

      next();
    } catch (error) {
      console.error('Error de autenticacion Socket.io:', error);
      next(new Error('Autenticacion fallida'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.userId} (${socket.tipoUsuario})`);

    const userKey = `${socket.userId}_${socket.tipoUsuario}`;
    socket.userKey = userKey;

    const becameOnline = addUserConnection(userKey, socket.id);

    if (becameOnline) {
      socket.broadcast.emit('user_online', {
        userId: socket.userId,
        tipoUsuario: socket.tipoUsuario
      });
    }

    socket.emit('online_users', getOnlineUserKeys());

    socket.on('join_conversations', async (conversacionesIds) => {
      try {
        conversacionesIds.forEach((id) => {
          socket.join(`conversacion_${id}`);
        });

        console.log(`Usuario ${socket.userId} unido a ${conversacionesIds.length} conversaciones`);
      } catch (error) {
        console.error('Error al unirse a conversaciones:', error);
      }
    });

    socket.on('send_message', async (data, ack) => {
      try {
        const {
          conversacion_id,
          mensaje,
          tipo_mensaje = 'texto',
          client_temp_id = null
        } = data;

        const conversacion = await Conversacion.findById(conversacion_id);
        if (!conversacion) {
          socket.emit('error', { message: 'Conversacion no encontrada' });
          if (typeof ack === 'function') {
            ack({ success: false, message: 'Conversacion no encontrada' });
          }
          return;
        }

        const isParticipante = conversacion.participantes.some(
          (p) => p.user_id === socket.userId && p.tipo_usuario === socket.tipoUsuario
        );

        if (!isParticipante) {
          socket.emit('error', { message: 'No tienes acceso a esta conversacion' });
          if (typeof ack === 'function') {
            ack({ success: false, message: 'No tienes acceso a esta conversacion' });
          }
          return;
        }

        const nuevoMensaje = await Mensaje.create({
          conversacion_id,
          user_id: socket.userId,
          tipo_usuario: socket.tipoUsuario,
          mensaje,
          tipo_mensaje
        });

        const participante = conversacion.participantes.find(
          (p) => p.user_id === socket.userId && p.tipo_usuario === socket.tipoUsuario
        );

        const mensajeCompleto = {
          ...nuevoMensaje,
          remitente_nombre: participante?.nombre || 'Usuario',
          client_temp_id
        };

        io.to(`conversacion_${conversacion_id}`).emit('new_message', mensajeCompleto);

        if (typeof ack === 'function') {
          ack({ success: true, mensaje: mensajeCompleto });
        }

        sendChatPush({
          conversacion,
          mensajeCompleto,
          senderUserId: socket.userId,
          senderTipoUsuario: socket.tipoUsuario
        }).catch((err) => console.error('Push error (socket):', err));
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
        if (typeof ack === 'function') {
          ack({ success: false, message: 'Error al enviar mensaje' });
        }
      }
    });

    socket.on('typing', (data) => {
      const { conversacion_id, isTyping } = data;
      socket.to(`conversacion_${conversacion_id}`).emit('user_typing', {
        userId: socket.userId,
        tipoUsuario: socket.tipoUsuario,
        conversacion_id,
        isTyping
      });
    });

    socket.on('mark_read', async (data) => {
      try {
        const { conversacion_id } = data;
        const now = new Date().toISOString();

        const updatedRead = await Conversacion.markAsReadAt(
          conversacion_id,
          socket.userId,
          socket.tipoUsuario,
          now
        );

        io.to(`conversacion_${conversacion_id}`).emit('messages_read', {
          conversacion_id,
          user_id: socket.userId,
          tipo_usuario: socket.tipoUsuario,
          timestamp: updatedRead?.last_read || now
        });
      } catch (error) {
        console.error('Error al marcar como leido:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.userId} (${socket.tipoUsuario})`);
      const becameOffline = removeUserConnection(socket.userKey, socket.id);

      if (becameOffline) {
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          tipoUsuario: socket.tipoUsuario
        });
      }
    });
  });

  const onlineUsersInterval = setInterval(() => {
    io.emit('online_users', getOnlineUserKeys());
  }, 30000);

  process.on('SIGTERM', () => clearInterval(onlineUsersInterval));
};

module.exports = { initializeSocket, connectedUsers };
