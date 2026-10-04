const CACHE = "mes-courses-v2";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Réseau d'abord (les mises à jour GitHub restent visibles), cache en secours hors ligne.
// On ne met en cache que le site lui-même et les scripts Firebase (gstatic) ;
// la base de données Firebase et le reste passent directement par le réseau.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const ok = url.origin === self.location.origin || url.hostname === "www.gstatic.com";
  if (!ok) return;
  e.respondWith(
    fetch(req)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return r;
      })
      .catch(() => caches.match(req))
  );
});
