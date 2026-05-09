const CACHE_NAME = 'lensflow-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon-512.png',
  '/logo192.png',
  '/favicon.png',
];

// Install — statik dosyaları cache'le
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — eski cache'leri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Sadece same-origin ve HTML sayfaları için çalış
  if (url.origin !== self.location.origin) return;

  // HTML sayfaları için network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    );
  }
});
