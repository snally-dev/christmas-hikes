const PREFIX = "snally-christmas-hikes-";
const CACHE_NAME = PREFIX + BUILD_ID;
const ROOT = new URL(self.registration.scope);
const SHELL = new URL("index.html", ROOT).href;
const PRECACHE = BUILD_FILES.map((path) => new URL(path, ROOT).href);
const ASSETS = new Set(PRECACHE);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })));
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => key.startsWith(PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(ROOT.href)) return;

  const url = new URL(request.url);
  const isLaunch =
    request.mode === "navigate" &&
    (url.pathname === ROOT.pathname || url.pathname === new URL(SHELL).pathname);
  if (!isLaunch && !ASSETS.has(request.url)) return;

  event.respondWith(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => (await cache.match(isLaunch ? SHELL : request)) ?? fetch(request)),
  );
});
