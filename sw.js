// Santaglia Compass — Service Worker
// v2 (2-jul-2026): NETWORK-FIRST para navegaciones — el HTML siempre fresco tras cada deploy
// (el cache-first de v1 servía la landing vieja para siempre a quien ya había visitado).
const CACHE = 'santaglia-v2';
const ASSETS = ['/', '/index.html', '/logo.png', '/brand.mp4', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // HTML (navegaciones): red primero, caché solo como respaldo sin conexión.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then(c => c || caches.match('/index.html')))
    );
    return;
  }
  // Estáticos: caché primero (rápido), red como respaldo.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});
