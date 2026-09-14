// Hand-written service worker for the static-export site (no Workbox/Serwist —
// see AGENTS.md: no new dependencies). Registered by
// components/pwa/ServiceWorkerRegistration.tsx in production builds only.
//
// Versioning: bump CACHE_VERSION whenever the precache list or a caching
// strategy below changes. Each version gets its own cache names
// (`app-shell-v${CACHE_VERSION}`, `static-assets-v${CACHE_VERSION}`); on
// `activate` any cache from a previous version is deleted. The new service
// worker still waits for `skipWaiting`/`clients.claim` before controlling
// existing tabs, so a version bump is what actually invalidates old entries —
// simply editing files without bumping the version leaves stale responses in
// place until they naturally fall out of the network-first/SWR strategies.
const CACHE_VERSION = 2;
const APP_SHELL_CACHE = `app-shell-v${CACHE_VERSION}`;
const STATIC_ASSETS_CACHE = `static-assets-v${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([APP_SHELL_CACHE, STATIC_ASSETS_CACHE]);

// This worker's own env has no access to NEXT_PUBLIC_BASE_PATH (it's a
// plain static file, not bundled), so the base path is derived from where
// the browser fetched it from: it's always served from `<base>/sw.js`, so
// resolving "./" against its own location gives "<base>/" and stripping the
// trailing slash gives "<base>" (or "" when there is no base path).
const BASE = new URL("./", self.location.href).pathname.replace(/\/$/, "");

const APP_SHELL_URLS = [`${BASE}/`, `${BASE}/offline/`, `${BASE}/manifest.webmanifest`];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      // Precache best-effort: a single failing entry (e.g. offline during a
      // build preview) shouldn't block installation of the rest.
      await Promise.all(
        APP_SHELL_URLS.map((url) =>
          cache.add(url).catch((err) => console.warn("[sw] precache failed", url, err))
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => !CURRENT_CACHES.has(name)).map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith(`${BASE}/_next/static/`) ||
    url.pathname.startsWith(`${BASE}/icons/`) ||
    url.pathname === `${BASE}/search-index.json`
  );
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(APP_SHELL_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cache = await caches.open(APP_SHELL_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(`${BASE}/offline/`);
    if (offline) return offline;
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_ASSETS_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached ?? (await networkPromise) ?? Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache cross-origin requests (e.g. YouTube embeds/thumbnails).
  if (url.origin !== self.location.origin) return;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
