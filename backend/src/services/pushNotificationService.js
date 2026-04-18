const { getMessaging } = require('../config/firebase');
const FcmToken = require('../models/FcmToken');

const MAX_BODY_LENGTH = 100;

const truncate = (text, max) =>
  text && text.length > max ? text.substring(0, max) + '…' : (text || '');

const sendPushToUsers = async (recipients, notification, data = {}) => {
  const messaging = getMessaging();
  if (!messaging || !recipients.length) return;

  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
  );

  for (const { userId, tipoUsuario } of recipients) {
    const tokens = await FcmToken.getByUser(userId, tipoUsuario);
    if (!tokens.length) continue;

    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification,
          data: stringData,
          android: {
            priority: 'high',
            notification: {
              channelId: 'chat_messages',
              priority: 'high',
              sound: 'default'
            }
          }
        });
      } catch (err) {
        if (
          err.code === 'messaging/invalid-registration-token' ||
          err.code === 'messaging/registration-token-not-registered'
        ) {
          await FcmToken.removeToken(token);
        } else {
          console.error('FCM send error:', err.message);
        }
      }
    }
  }
};

const sendChatPush = async ({ conversacion, mensajeCompleto, senderUserId, senderTipoUsuario }) => {
  const messaging = getMessaging();
  if (!messaging) return;

  const recipients = (conversacion.participantes || []).filter(
    p => !(p.user_id === senderUserId && p.tipo_usuario === senderTipoUsuario)
  );
  if (!recipients.length) return;

  const senderName = mensajeCompleto.remitente_nombre || 'Nuevo mensaje';
  const body =
    mensajeCompleto.tipo_mensaje === 'texto' ? truncate(mensajeCompleto.mensaje, MAX_BODY_LENGTH)
    : mensajeCompleto.tipo_mensaje === 'imagen' ? '📷 Imagen'
    : mensajeCompleto.tipo_mensaje === 'audio' ? '🎤 Audio'
    : '📎 Archivo';

  const title = conversacion.tipo === 'proyecto_grupo'
    ? `${conversacion.nombre || 'Grupo'}: ${senderName}`
    : senderName;

  await sendPushToUsers(
    recipients.map(p => ({ userId: p.user_id, tipoUsuario: p.tipo_usuario })),
    { title, body },
    {
      type: 'chat',
      conversacion_id: String(conversacion.id),
      conversacion_tipo: conversacion.tipo || 'directo',
      conversacion_nombre: conversacion.nombre || ''
    }
  );
};

module.exports = { sendChatPush, sendPushToUsers };
