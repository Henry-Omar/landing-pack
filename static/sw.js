// Landing Pack service worker — app-shell cache + offline support.
const CACHE = "lp-shell-v1";
const SHELL = [
  "/",
  "/static/index.html",
  "/static/app.js",
  "/static/style.css",
  "/static/icon.svg",
  "/static/icon-mask.svg",
  "/manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache API calls here (app.js handles its own cache); only cache static shell.
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  // Cache-first for static assets.
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return resp;
    }).catch(() => cached))
  );
});
