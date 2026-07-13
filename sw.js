const CACHE_NAME = "psi-ops-shell-20260714-fornitori-layout-v2";
const APP_SHELL = [
  "/",
  "/?shell=20260714-fornitori-layout-v2",
  "/index.html",
  "/garden-planner.html",
  "/garden-planner.html?shell=20260714-fornitori-layout-v2",
  "/garden-planner.html?v=20260714-fornitori-layout-v2&shell=20260714-fornitori-layout-v2",
  "/garden-photo-configurator.html?v=20260416-photo-loader-fix-34",
  "/garden-photo-configurator-v2.html?v=20260416-photo-loader-fix-34",
  "/garden-planner-page.js?v=20260714-fornitori-layout-v2",
  "/styles.css?v=20260714-fornitori-layout-v2",
  "/app.js?v=20260714-fornitori-layout-v2",
  "/lib/order-money.js?v=20260714-fornitori-layout-v2",
  "/lib/geo.js?v=20260714-fornitori-layout-v2",
  "/lib/comuni-regioni.js?v=20260714-fornitori-layout-v2",
  "/logo-prato.png",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/preventivo-v2.html?embedded=1&p2=1&v=20260714-fornitori-layout-v2",
  "/preventivo-v2.html?embedded=1&p2=0&v=20260714-fornitori-layout-v2",
  "/vendor/signature_pad.umd.min.js?v=20260714-fornitori-layout-v2",
  "/vendor/html2pdf.bundle.min.js?v=20260714-fornitori-layout-v2",
];
const NETWORK_FIRST_PATHS = new Set([
  "/",
  "/index.html",
  "/garden-planner.html",
  "/garden-photo-configurator.html",
  "/garden-photo-configurator-v2.html",
  "/preventivo-v2.html",
  // app.js, styles.css, garden-planner-page.js sono versionati (?v=...) e pre-cachati
  // nell'install step → cache-first è corretto, evita una richiesta network inutile
  "/manifest.webmanifest",
]);

self.addEventListener("install", (event) => {
  // Preso controllo immediatamente senza aspettare la chiusura dei tab
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Prende controllo di tutti i tab aperti subito
      self.clients.claim(),
      // Cancella le vecchie cache
      caches.keys().then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      )),
    ])
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? JSON.parse(event.data.text()) : {}; } catch {}
  const title = String(payload.title || "PSI Ops");
  const body = String(payload.body || "");
  const data = payload.data || {};
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
      tag: payload.type || "psi-ops",
      renotify: true,
      data,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const view = data.view || "";
  const targetUrl = view ? `/?view=${encodeURIComponent(view)}` : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        if (view) existing.postMessage({ type: "NAVIGATE_TO_VIEW", view });
        return;
      }
      return self.clients.openWindow(targetUrl);
    })
  );
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
