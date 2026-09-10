// ArchLingo Service Worker - Network-first with cache-busting
const CACHE_NAME = 'archlingo-100-v4-clean';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Always fetch network first to ensure latest curriculum and fixes are served
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
