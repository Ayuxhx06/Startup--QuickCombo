self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('/delivery/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/delivery/dashboard');
      }
    })
  );
});

self.addEventListener('push', function(event) {
  let payload = {
    title: 'New QuickCombo Order! 🛵',
    body: 'A new order is available. Tap to view.'
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'new-order-' + (payload.order_id || Date.now()),
    requireInteraction: true,
    data: {
      orderId: payload.order_id
    }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});
