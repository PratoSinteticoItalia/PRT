const CACHE_NAME = "psi-ops-shell-20260412-apple-enterprise-15";
const APP_SHELL = [
  "/",
  "/index.html",
  "/garden-planner.html",
  "/garden-planner-page.js?v=20260412-apple-enterprise-15",
  "/styles.css?v=20260412-apple-enterprise-15",
  "/app.js?v=20260412-apple-enterprise-15",
  "/logo-prato.png",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];
const NETWORK_FIRST_PATHS = new Set([
  "/",
  "/index.html",
  "/garden-planner.html",
  "/garden-planner-page.js",
  "/styles.css",
  "/app.js",
  "/manifest.webmanifest",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const isShellRequest = request.mode === "navigate" || NETWORK_FIRST_PATHS.has(url.pathname);
  if (isShellRequest) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        const fallbackTarget = request.mode === "navigate" ? "/index.html" : request;
        const networkPromise = fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== "basic") return response;
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
            return response;
          })
          .catch(async () => cached || caches.match(fallbackTarget));

        if (cached) {
          event.waitUntil(networkPromise.then(() => undefined).catch(() => undefined));
          return cached;
        }
        return networkPromise;
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      });
    }),
  );
});
