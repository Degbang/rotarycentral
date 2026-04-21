// Minimal service worker to enable installability.
// We intentionally do NOT add runtime caching for API/data responses (private app).

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

