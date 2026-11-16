// Service worker: permite instalar la app y abrirla sin conexión.
// Subí el número de versión cada vez que cambies algún archivo.
const CACHE = "gastos-v1";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(ARCHIVOS.map((url) => new Request(url, { cache: "reload" })))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  // Páginas: primero internet; sin conexión, la copia guardada
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copia));
          return resp;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Resto (íconos, fuentes, librería de Excel): caché primero y actualización en segundo plano
  e.respondWith(
    caches.match(e.request).then((enCache) => {
      const red = fetch(e.request)
        .then((resp) => {
          if (resp && (resp.ok || resp.type === "opaque")) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copia));
          }
          return resp;
        })
        .catch(() => enCache);
      return enCache || red;
    })
  );
});
