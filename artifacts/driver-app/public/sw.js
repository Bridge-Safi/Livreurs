const CACHE_NAME = 'bridge-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Bridge', body: event.data ? event.data.text() : 'Nouvelle commande' };
  }

  const title = data.title || 'Bridge — Nouvelle commande';
  const options = {
    body: data.body || 'Vous avez 7 minutes pour accepter.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [400, 150, 400, 150, 400, 150, 800],
    tag: 'bridge-dispatch',
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Ouvrir' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
