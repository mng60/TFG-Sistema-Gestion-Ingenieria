const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

const getServiceAccountFromEnv = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n')
  };
};

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    let serviceAccount = getServiceAccountFromEnv();

    if (!serviceAccount) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      if (!serviceAccountPath) {
        console.warn('Firebase no configurado - push notifications desactivadas');
        return null;
      }

      const resolved = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(__dirname, '..', '..', serviceAccountPath);
      serviceAccount = require(resolved);
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK inicializado');
    return firebaseApp;
  } catch (err) {
    console.error('Error inicializando Firebase Admin SDK:', err.message);
    return null;
  }
};

const getMessaging = () => {
  if (!firebaseApp) return null;
  return admin.messaging(firebaseApp);
};

module.exports = { initializeFirebase, getMessaging };
