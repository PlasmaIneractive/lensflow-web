const CACHE_NAME = 'lensflow-v1';
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

  // Firebase, Anthropic, Cloudflare API isteklerini cache'leme
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('anthropic.com') ||
    url.hostname.includes('cloudfunctions.net') ||
    url.hostname.includes('img.lensflow.news')
  ) {
    return;
  }

  // HTML sayfaları için network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // Statik dosyalar için cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
