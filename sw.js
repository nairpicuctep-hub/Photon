// sw.js — service worker for offline play (brief §12). NETWORK-FIRST for the
// app's own files so a fresh deploy shows up immediately when online; falls back
// to the cache only when offline. Precaches the app shell so the game still
// launches with no connection. Requires HTTPS or localhost (won't register from
// file://).
//
// Bump CACHE on any change that must force-purge old cached assets. The previous
// worker was cache-first with a fixed name, which froze installed PWAs on the
// first-cached build — hence the version bump + strategy change.

const CACHE = 'echipa-lumina-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for same-origin GETs: try the network so the latest deploy wins,
// refresh the cached copy, and fall back to cache (or the shell) when offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let sameOrigin = false;
  try { sameOrigin = new URL(req.url).origin === self.location.origin; } catch (_) { /* opaque */ }
  if (!sameOrigin) return; // let cross-origin requests go straight to the network

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
      )
  );
});
