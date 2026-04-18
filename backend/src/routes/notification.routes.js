const express = require('express');
const authAnyMiddleware = require('../middlewares/authAny.middleware');
const FcmToken = require('../models/FcmToken');

const router = express.Router();

router.use(authAnyMiddleware);

// POST /api/notifications/fcm-token — register device token
router.post('/fcm-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token requerido' });
    }
    await FcmToken.upsert(req.user.id, req.user.tipo_usuario, token);
    res.json({ success: true });
  } catch (err) {
    console.error('Error guardando FCM token:', err);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// DELETE /api/notifications/fcm-token — unregister on logout
router.delete('/fcm-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (token) {
      await FcmToken.removeToken(token);
    } else {
      await FcmToken.removeByUser(req.user.id, req.user.tipo_usuario);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error eliminando FCM token:', err);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
