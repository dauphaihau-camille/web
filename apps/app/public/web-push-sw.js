/* global self */

// No-op placeholder service worker file to prevent the request from falling
// through to the dynamic workspace route in development.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
