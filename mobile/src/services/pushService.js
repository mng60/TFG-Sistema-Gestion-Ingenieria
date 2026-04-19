import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import api from './api';

let currentToken = null;
let listenersRegistered = false;

export const clearDeliveredChatNotifications = async (conversacionId = null) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const delivered = await PushNotifications.getDeliveredNotifications();
    const notificationsToRemove = (delivered.notifications || []).filter((notification) => {
      if (notification.data?.type !== 'chat') return false;
      if (!conversacionId) return true;
      return String(notification.data?.conversacion_id) === String(conversacionId);
    });

    if (!notificationsToRemove.length) return;

    await PushNotifications.removeDeliveredNotifications(notificationsToRemove);
  } catch (err) {
    console.error('Error limpiando notificaciones push:', err);
  }
};

export const registerPushNotifications = async (onForegroundNotification) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      const result = await PushNotifications.requestPermissions();
      permStatus = result;
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission not granted');
      return;
    }

    if (!listenersRegistered) {
      listenersRegistered = true;

      await PushNotifications.addListener('registration', async (tokenData) => {
        currentToken = tokenData.value;
        try {
          await api.post('/notifications/fcm-token', { token: currentToken });
          console.log('FCM token registrado en backend');
        } catch (err) {
          console.error('Error registrando FCM token:', err);
        }
      });

      await PushNotifications.addListener('registrationError', (err) => {
        console.error('Error de registro push:', err.error);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        if (onForegroundNotification) {
          onForegroundNotification({
            title: notification.title || notification.data?.title,
            body: notification.body || notification.data?.body,
            data: notification.data
          });
        }
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = action.notification.data;
        if (data?.type === 'chat' && data?.conversacion_id) {
          clearDeliveredChatNotifications(data.conversacion_id);
          sessionStorage.setItem('push_open_conversacion_id', data.conversacion_id);
          if (window.__pushNavigateToChat) {
            window.__pushNavigateToChat(data.conversacion_id);
          }
        }
      });
    }

    await PushNotifications.createChannel({
      id: 'chat_messages',
      name: 'Mensajes de chat',
      description: 'Notificaciones de nuevos mensajes del chat',
      importance: 5,
      visibility: 1,
      sound: 'default'
    });

    await PushNotifications.register();
  } catch (err) {
    console.error('Error configurando push notifications:', err);
  }
};

export const unregisterPushToken = async () => {
  if (!Capacitor.isNativePlatform() || !currentToken) return;
  try {
    await api.delete('/notifications/fcm-token', { data: { token: currentToken } });
  } catch (err) {
    console.error('Error eliminando FCM token:', err);
  } finally {
    currentToken = null;
  }
};

export const getCurrentFcmToken = () => currentToken;
