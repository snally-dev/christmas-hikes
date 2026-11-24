const CACHE_NAME = "snally-christmas-hikes-v2";
const ROOT = new URL("./", self.registration.scope);
const PRECACHE = [
  "",
  "manifest.webmanifest",
  "data/hikes.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  `badges/01-weverton-cliffs.webp`,
  `badges/01-weverton-cliffs-locked.webp`,
  `badges/02-brooks-hill.webp`,
  `badges/02-brooks-hill-locked.webp`,
  `badges/03-blue-blazes.webp`,
  `badges/03-blue-blazes-locked.webp`,
  `badges/04-burnside-bridge.webp`,
  `badges/04-burnside-bridge-locked.webp`,
  `badges/05-williamsport-lock-44.webp`,
  `badges/05-williamsport-lock-44-locked.webp`,
  `badges/06-murphy-chambers-farm.webp`,
  `badges/06-murphy-chambers-farm-locked.webp`,
].map((path) => new URL(path, ROOT).toString());

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE);
      const shell = await cache.match(ROOT.toString());
      if (shell) {
        const html = await shell.text();
        const bundledAssets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
          .map((match) => new URL(match[1], ROOT).toString())
          .filter((url) => url.startsWith(ROOT.toString()) && url.includes("/assets/"));
        await cache.addAll(bundledAssets);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("snally-christmas-hikes-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(ROOT.toString(), copy));
          return response;
        })
        .catch(() => caches.match(ROOT.toString())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
