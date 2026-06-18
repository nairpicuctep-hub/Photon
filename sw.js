// sw.js — service worker for offline play (brief §12). Precaches the app shell
// and runtime-caches same-origin GETs (the ES modules) on first fetch, so the
// game launches and plays offline after the first load. Requires HTTPS or
// localhost (won't register from file://).

const CACHE = 'echipa-lumina-v1';
const SHELL = ['./', './index.html', './public/manifest.webmanifest', './public/icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((res) => {
        try {
          if (res && res.ok && new URL(req.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
        } catch (_) { /* ignore */ }
        return res;
      }).catch(() => hit)
    )
  );
});
