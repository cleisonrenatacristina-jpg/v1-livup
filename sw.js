// V1 LivUp — Service Worker
const CACHE = 'v1-livup-v1';
const ASSETS = [
  '/v1-livup/',
  '/v1-livup/index.html',
  '/v1-livup/v1-livup.html',
  '/v1-livup/manifest.json',
  '/v1-livup/icon-192.png',
  '/v1-livup/icon-512.png',
];

// Instala e faz cache dos assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(err) {
        console.log('Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Limpa caches antigos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Network First, fallback para cache
self.addEventListener('fetch', function(e) {
  // Ignora requisições externas (Google Sheets, Apps Script)
  if (!e.request.url.includes(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(function(resp) {
        // Atualiza cache com versão nova
        var respClone = resp.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, respClone);
        });
        return resp;
      })
      .catch(function() {
        // Offline: usa cache
        return caches.match(e.request).then(function(cached) {
          if (cached) return cached;
          // Fallback para página principal
          return caches.match('/v1-livup/');
        });
      })
  );
});

// Notificações push (futuro)
self.addEventListener('push', function(e) {
  if (!e.data) return;
  var data = e.data.json();
  self.registration.showNotification(data.title || 'V1 LivUp', {
    body: data.body || '',
    icon: '/v1-livup/icon-192.png',
    badge: '/v1-livup/icon-192.png',
    data: data
  });
});
