const DB_NAME = 'sgi_offline';
const DB_VERSION = 1;

const STORES = {
  conversaciones: 'conversaciones',
  mensajes: 'mensajes',
  pendingMessages: 'pendingMessages',
  pendingActualizaciones: 'pendingActualizaciones',
  infoParticipante: 'infoParticipante',
  archivos: 'archivos',
  proyectos: 'proyectos',
};

let db = null;

function openDB() {
  if (db) return Promise.resolve(db);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      Object.values(STORES).forEach(name => {
        if (!database.objectStoreNames.contains(name)) {
          database.createObjectStore(name);
        }
      });
    };
    request.onsuccess = (e) => { db = e.target.result; resolve(db); };
    request.onerror = (e) => reject(e.target.error);
  });
}

async function get(store, key) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function set(store, key, value) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function del(store, key) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getAll(store) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const results = [];
    const tx = database.transaction(store, 'readonly');
    const curReq = tx.objectStore(store).openCursor();
    curReq.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) { results.push({ key: cursor.key, value: cursor.value }); cursor.continue(); }
      else resolve(results);
    };
    curReq.onerror = () => reject(curReq.error);
  });
}

export const offlineDB = {
  saveConversaciones: (list) => set(STORES.conversaciones, 'list', list),
  getConversaciones: () => get(STORES.conversaciones, 'list'),

  saveMensajes: (conversacionId, mensajes) =>
    set(STORES.mensajes, String(conversacionId), mensajes),
  getMensajes: (conversacionId) =>
    get(STORES.mensajes, String(conversacionId)),

  addPendingMessage: (msg) => set(STORES.pendingMessages, msg.client_temp_id, msg),
  removePendingMessage: (clientTempId) => del(STORES.pendingMessages, clientTempId),
  getAllPendingMessages: () => getAll(STORES.pendingMessages),

  addPendingActualizacion: (tempId, data) =>
    set(STORES.pendingActualizaciones, tempId, data),
  removePendingActualizacion: (tempId) =>
    del(STORES.pendingActualizaciones, tempId),
  getAllPendingActualizaciones: () => getAll(STORES.pendingActualizaciones),

  saveInfoParticipante: (userId, tipo, data) =>
    set(STORES.infoParticipante, `${userId}_${tipo}`, data),
  getInfoParticipante: (userId, tipo) =>
    get(STORES.infoParticipante, `${userId}_${tipo}`),

  saveArchivos: (conversacionId, archivos) =>
    set(STORES.archivos, String(conversacionId), archivos),
  getArchivos: (conversacionId) =>
    get(STORES.archivos, String(conversacionId)),

  saveProyectoInfo: (proyectoId, data) =>
    set(STORES.proyectos, `proyecto_${proyectoId}`, data),
  getProyectoInfo: (proyectoId) =>
    get(STORES.proyectos, `proyecto_${proyectoId}`),

  saveProyectos: (list) => set(STORES.proyectos, 'list', list),
  getProyectos: () => get(STORES.proyectos, 'list'),
};
