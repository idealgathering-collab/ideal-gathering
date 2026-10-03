/* Havato Step 2: static resources only; never cache pages or API responses. */
const CACHE_PREFIX = "havato-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
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

function safeNotificationUrl(value) {
  try {
    if (typeof value !== "string" || value.length > 512 || /[\p{Cc}\\]/u.test(value)) return `${self.location.origin}/`;
    const url = new URL(value, self.location.origin);
    if (url.origin !== self.location.origin || url.username || url.password ||
        !/^\/(?:pending|settings)?$/.test(url.pathname) || url.search || url.hash) return `${self.location.origin}/`;
    return url.href;
  } catch { return `${self.location.origin}/`; }
}

function notificationPayload(event) {
  const fallback = { title: "Havato / هواتو", body: "Open Havato / هواتو را باز کنید", url: "/", tag: "havato-notification", lang: "en" };
  try {
    const value = event.data?.json();
    if (!value || value.version !== 1 || !["en", "fa"].includes(value.lang) ||
        typeof value.title !== "string" || !value.title.trim() || value.title.length > 100 ||
        typeof value.body !== "string" || !value.body.trim() || value.body.length > 500 ||
        typeof value.tag !== "string" || !value.tag.trim() || value.tag.length > 64 ||
        /\p{Cc}/u.test(value.title + value.body + value.tag)) return fallback;
    return { title: value.title, body: value.body, url: value.url, tag: value.tag, lang: value.lang };
  } catch { return fallback; }
}

self.addEventListener("push", (event) => {
  const payload = notificationPayload(event);
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body, icon: "/favicon-192.png", badge: "/favicon.png",
    tag: payload.tag, lang: payload.lang, dir: payload.lang === "fa" ? "rtl" : "ltr",
    data: { url: safeNotificationUrl(payload.url) },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = safeNotificationUrl(event.notification.data?.url);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const appWindows = windows.filter((client) => {
      try { return new URL(client.url).origin === self.location.origin; } catch { return false; }
    });
    const exact = appWindows.find((client) => client.url === url);
    if (exact) { await exact.focus(); return; }
    if (appWindows.length) {
      try {
        const navigated = await appWindows[0].navigate(url);
        if (navigated) { await navigated.focus(); return; }
      } catch { await self.clients.openWindow(url); return; }
    }
    await self.clients.openWindow(url);
  })());
});

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
