const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_PATH no configurado — push notifications desactivadas');
    return null;
  }

  try {
    const resolved = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.join(__dirname, '..', '..', serviceAccountPath);
    const serviceAccount = require(resolved);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin SDK inicializado');
    return firebaseApp;
  } catch (err) {
    console.error('❌ Error inicializando Firebase Admin SDK:', err.message);
    return null;
  }
};

const getMessaging = () => {
  if (!firebaseApp) return null;
  return admin.messaging(firebaseApp);
};

module.exports = { initializeFirebase, getMessaging };
