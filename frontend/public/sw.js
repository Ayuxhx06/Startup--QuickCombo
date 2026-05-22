/* =====================================================================
   QuickCombo Service Worker — Background Push Notifications
   Handles: new orders (riders & admin), rider accepted (admin)
   ===================================================================== */

const CACHE_VERSION = 'qc-sw-v3';

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

/* ── Push received (background / foreground) ── */
self.addEventListener('push', function (event) {
  let payload = {
    title: 'QuickCombo Notification',
    body: 'Tap to open the app.',
    type: 'generic',
    url: '/',
    tag: 'qc-' + Date.now(),
    order_id: null,
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = Object.assign(payload, parsed);
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  // Choose icon & badge based on notification type
  const icon  = '/favicon.ico';
  const badge = '/favicon.ico';

  const options = {
    body: payload.body,
    icon: icon,
    badge: badge,
    tag: payload.tag || ('qc-' + (payload.order_id || Date.now())),
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || '/',
      type: payload.type,
      order_id: payload.order_id,
    },
    actions: [
      { action: 'open', title: '📋 Open' },
      { action: 'dismiss', title: '✖ Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

/* ── Notification click: open correct page ── */
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || '/';

  // Route by notification type
  const type = notifData.type || '';
  if (type === 'admin_new_order' || type === 'admin_rider_accepted') {
    targetUrl = '/admin';
  } else if (type === 'new_order') {
    targetUrl = '/rider/dashboard';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      // Try to focus an existing tab with the correct URL
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        var clientUrl = new URL(client.url);
        if (clientUrl.pathname === targetUrl || client.url.includes(targetUrl)) {
          return client.focus();
        }
      }
      // Open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

/* ── Background Sync (optional, future) ── */
self.addEventListener('sync', function (event) {
  console.log('[SW] Background sync:', event.tag);
});
