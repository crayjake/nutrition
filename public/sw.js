self.addEventListener("push", (event) => {
  let message = {
    title: "Crux meal reminder",
    body: "Your next meal is coming up.",
    tag: "crux-meal-reminder",
    icon: "./app-icon-v5-192.png",
    url: self.registration.scope
  };

  if (event.data) {
    try {
      message = { ...message, ...event.data.json() };
    } catch {
      message.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      icon: message.icon,
      badge: message.icon,
      tag: message.tag,
      renotify: false,
      data: { url: message.url }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || self.registration.scope;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(self.registration.scope) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
