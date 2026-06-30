const SERVICE_WORKER_SOURCE = `
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
`;

export function GET() {
  return new Response(SERVICE_WORKER_SOURCE, {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/javascript; charset=utf-8',
    },
  });
}
