const SHELL_CACHE = 'sgi-shell-v1';
const PHOTO_CACHE = 'sgi-photos-v1';

// Al instalar: cachear el shell mínimo
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(['/', '/index.html']))
  );
  self.skipWaiting();
});

// Al activar: limpiar caches antiguas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== PHOTO_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interceptar llamadas a la API (las gestiona IndexedDB desde React)
  if (url.pathname.startsWith('/api/')) return;

  // Fotos de perfil y archivos subidos: cache-first
  if (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/api/uploads/')) {
    e.respondWith(
      caches.open(PHOTO_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached || new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // App shell (JS, CSS, HTML, imágenes de la app): stale-while-revalidate
  e.respondWith(
    caches.open(SHELL_CACHE).then(cache =>
      cache.match(request).then(cached => {
        const fetchPromise = fetch(request)
          .then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);

        // Si tenemos cache sirve inmediatamente y actualiza en background;
        // si no hay cache esperamos la red
        return cached || fetchPromise.then(r => r || new Response('Sin conexión', { status: 503 }));
      })
    )
  );
});
