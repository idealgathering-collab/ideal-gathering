/* Havato Step 2: static resources only; never cache pages or API responses. */
const CACHE_PREFIX = "havato-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_URL = "/offline.html";
const STATIC_URLS = [
  OFFLINE_URL,
  "/favicon.png",
  "/favicon-192.png",
  "/favicon-512.png",
  "/apple-touch-icon.png",
  "/havato-app-icon-1024.png",
];
const MAX_ENTRIES = 64;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(
        STATIC_URLS.map((url) => new Request(url, { cache: "reload", credentials: "omit" })),
      );
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

async function staticResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    // Static requests deliberately carry no cookies or authorization credentials.
    const response = await fetch(new Request(request, { credentials: "omit" }));
    const type = response.headers.get("content-type") || "";
    const policy = response.headers.get("cache-control") || "";
    if (response.ok && !response.redirected &&
        !/no-store|private/i.test(policy) &&
        /^(text\/css|(?:text|application)\/javascript|image\/png|font\/woff2)(?:;|$)/i.test(type)) {
      try {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        const removable = keys.filter((key) => !STATIC_URLS.includes(new URL(key.url).pathname));
        while (keys.length > MAX_ENTRIES && removable.length) {
          await cache.delete(removable.shift());
          keys.pop();
        }
      } catch {
        // Storage quota/availability must not break an online asset response.
      }
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin ||
      request.headers.has("authorization") || /^\/(?:api|_server|supabase)(?:\/|$)/.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(OFFLINE_URL)) || new Response(
          "<!doctype html><html><title>Havato — Offline</title><body><h1>Havato</h1><p>You're offline. Check your connection and try again.</p><a href='/'>Try again</a></body></html>",
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }),
    );
    return;
  }

  // Only exact public files or fingerprinted build CSS/JS/fonts, without queries.
  const isBuildAsset = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2)$/.test(url.pathname);
  if (!url.search && (STATIC_URLS.includes(url.pathname) || isBuildAsset)) {
    event.respondWith(staticResponse(request));
  }
});
