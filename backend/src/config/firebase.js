const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

const normalizePrivateKey = (privateKey) => {
  if (!privateKey) return privateKey;

  let normalized = privateKey.trim();

  if (
    normalized.startsWith('"') &&
    normalized.endsWith('"')
  ) {
    normalized = normalized.slice(1, -1);
  }

  return normalized.replace(/\\n/g, '\n');
};

const getServiceAccountFromEnv = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  if (privateKey.includes('/n') && !privateKey.includes('\\n') && !privateKey.includes('\n')) {
    console.warn('FIREBASE_PRIVATE_KEY parece usar /n en vez de \\n');
  }

  const normalizedPrivateKey = normalizePrivateKey(privateKey);

  if (!normalizedPrivateKey.includes('BEGIN PRIVATE KEY')) {
    console.warn('FIREBASE_PRIVATE_KEY no contiene el encabezado esperado de una clave PEM');
  }

  return {
    projectId,
    clientEmail,
    privateKey: normalizedPrivateKey
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

    console.log('Inicializando Firebase Admin SDK con credenciales de', serviceAccount.projectId);
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
