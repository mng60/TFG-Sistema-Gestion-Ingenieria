import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import api from './api';

let currentToken = null;
let listenersRegistered = false;

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

    await PushNotifications.register();

    if (listenersRegistered) return;
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

    // Notificación recibida con app en primer plano → banner in-app
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      if (onForegroundNotification) {
        onForegroundNotification({
          title: notification.title || notification.data?.title,
          body: notification.body || notification.data?.body,
          data: notification.data
        });
      }
    });

    // Usuario toca notificación del sistema (app en background o cerrada)
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data;
      if (data?.type === 'chat' && data?.conversacion_id) {
        sessionStorage.setItem('push_open_conversacion_id', data.conversacion_id);
        // Si la app ya está en primer plano, hacer navigate al chat
        if (window.__pushNavigateToChat) {
          window.__pushNavigateToChat(data.conversacion_id);
        }
      }
    });

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
