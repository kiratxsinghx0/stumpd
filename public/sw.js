const STATIC_CACHE = "stumpd-static-v1";
const API_CACHE = "stumpd-api-v2";
const API_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const STATIC_ASSETS = [
  "/stumpd-logo.png",
  "/og-image.png",
  "/manifest.json",
  "/ipl-players-fallback.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  // API calls: network-first, fall back to cache (with max-age check)
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(API_CACHE).then((c) => {
              const headers = new Headers(clone.headers);
              headers.set("sw-cached-at", String(Date.now()));
              c.put(event.request, new Response(clone.body, {
                status: clone.status,
                statusText: clone.statusText,
                headers,
              }));
            });
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => {
            if (!cached) return fetch(event.request);
            const cachedAt = Number(cached.headers.get("sw-cached-at") || 0);
            if (Date.now() - cachedAt > API_CACHE_MAX_AGE_MS) {
              return fetch(event.request).catch(() => cached);
            }
            return cached;
          }),
        ),
    );
    return;
  }

  // Static assets: cache-first
  if (STATIC_ASSETS.some((a) => url.pathname === a)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request)),
    );
    return;
  }

  // Everything else: network with no interception
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
