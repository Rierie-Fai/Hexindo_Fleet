const CACHE_NAME = 'hexindo-pro-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'login.html',
  'settings.html',
  'style.css',
  'admin-style.css',
  'app.js',
  'script.js',
  'admin-script.js',
  'manifest.json',
  'logo.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch Assets from Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

