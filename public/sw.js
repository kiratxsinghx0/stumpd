self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "Stumpd", body: event.data?.text() || "You have a new notification!" };
  }
  const title = data.title || "Stumpd";
  const options = {
    body: data.body || "Today's puzzle is live! Can you guess the player?",
    icon: "/stumpd-logo.png",
    badge: "/stumpd-logo.png",
    data: { url: data.url || "/stumpd" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/stumpd";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes("/stumpd") && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
