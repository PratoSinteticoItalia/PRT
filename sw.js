const CACHE_NAME = "psi-ops-shell-20260417-session-revision-sync-41";
const APP_SHELL = [
  "/",
  "/?shell=20260417-session-revision-sync-41",
  "/index.html",
  "/garden-planner.html",
  "/garden-planner.html?shell=20260415-shell-reset-33",
  "/garden-planner.html?v=20260414-garden-materials-02&shell=20260414-garden-materials-02",
  "/garden-photo-configurator.html?v=20260416-photo-loader-fix-34",
  "/garden-photo-configurator-v2.html?v=20260416-photo-loader-fix-34",
  "/garden-planner-page.js?v=20260414-garden-materials-02",
  "/styles.css?v=20260417-session-revision-sync-41",
  "/app.js?v=20260417-session-revision-sync-41",
  "/logo-prato.png",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/sales-suite/generator.html?embedded=1&v=20260415-generator-pdf-31&shell=20260415-generator-pdf-31",
  "/sales-suite/generator-bridge.js?v=20260415-generator-pdf-31",
  "/sales-suite/favicon.svg",
  "/sales-suite/icons.svg",
  "/sales-suite/logo-prato.png",
  "/sales-suite/assets/index-BSqK6a0l.css",
  "/sales-suite/assets/index-CelZjrUy.js",
];
const NETWORK_FIRST_PATHS = new Set([
  "/",
  "/index.html",
  "/garden-planner.html",
  "/garden-photo-configurator.html",
  "/garden-photo-configurator-v2.html",
  "/sales-suite/generator.html",
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
      (async () => {
        try {
          const response = await fetch(request);
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {}),
            );
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallbackTarget = request.mode === "navigate" ? "/index.html" : request;
          return caches.match(fallbackTarget);
        }
      })(),
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
