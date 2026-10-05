self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data.body = event.data?.text() || ''; }
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const visible = windows.find(client => client.visibilityState === 'visible');
    if (visible) visible.postMessage({ kind: 'vault-push', payload: data });
    // Show the browser notification in the foreground too; otherwise an accepted
    // push can be invisible when the app is open and no page listener is mounted.
    return self.registration.showNotification(data.title || 'Vault reminder', {
      body: data.body || 'You have a reminder waiting. Open Vault to take a look.',
      icon: '/assets/images/icon.png', data: data.data || { url: '/notifications' }, tag: 'vault-push',
    });
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/notifications', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    for (const client of clients) if (client.url.startsWith(self.location.origin) && 'focus' in client) { client.navigate(url); return client.focus(); }
    return self.clients.openWindow(url);
  }));
});
