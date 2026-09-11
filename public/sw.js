/**
 * Service worker: makes a return visit start fast.
 *
 * The expensive part of this site is not the HTML, it is the ~10 MB Pyodide
 * runtime plus whatever wheels a lesson pulls in — numpy, pandas, scikit-learn
 * and matplotlib are tens of megabytes more. All of it is immutable for a given
 * Pyodide version, so it is cached permanently and served from disk on every
 * later visit. The Python worker is a controlled client, so its fetches for the
 * runtime pass through here.
 *
 * Everything else stays conservative: pages are network-first so a deploy is
 * picked up immediately, and the build's own assets are content-hashed by
 * Astro, so they are safe to serve from cache while being refreshed.
 */

const VERSION = "v1";
const RUNTIME_CACHE = `lpai-pyodide-${VERSION}`;
const ASSET_CACHE = `lpai-assets-${VERSION}`;
const PAGE_CACHE = `lpai-pages-${VERSION}`;
const KEEP = new Set([RUNTIME_CACHE, ASSET_CACHE, PAGE_CACHE]);

/** The immutable Python runtime and its wheels. */
const isPyodide = (url) =>
  url.hostname === "cdn.jsdelivr.net" && url.pathname.startsWith("/pyodide/");

/** Build output: content-hashed by Astro, plus the static files we ship. */
const isAsset = (url) =>
  url.pathname.includes("/_astro/") ||
  url.pathname.includes("/pagefind/") ||
  /\.(?:css|js|mjs|woff2?|png|svg|jpg|jpeg|webp|ico)$/.test(url.pathname);

self.addEventListener("install", (event) => {
  // A new worker should take over rather than wait for every tab to close.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith("lpai-") && !KEEP.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

/** Serve from cache when we have it; otherwise fetch once and keep it. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  // Opaque responses have status 0 and an unknown body, so they are not stored.
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

/** Answer from cache immediately, and refresh the entry in the background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (hit) return hit;
  const response = await network;
  if (response) return response;
  throw new Error(`Offline and not cached: ${request.url}`);
}

/** Prefer the network so a deploy lands at once; fall back to the last copy. */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (isPyodide(url)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // Leave every other cross-origin request alone.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (isAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});
