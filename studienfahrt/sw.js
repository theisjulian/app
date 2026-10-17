// namo · Offline-Hülle. Nur für /studienfahrt/. Immer zuerst das Netz (Updates kommen sofort an),
// der Zwischenspeicher dient ausschließlich als Rückfallebene ohne Internet.
// Anfragen an Supabase (Anmeldung, Daten, Dateien) werden nie zwischengespeichert.
const CACHE = 'namo-shell-v11';
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js';
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './assets/andiamo-180.png?v=5', './assets/andiamo-192.png?v=5', './assets/andiamo.svg?v=5', './assets/favicon.ico?v=5', './assets/geist-latin-wght-normal.woff2', './assets/jspdf-4.2.1.umd.min.js', SUPABASE_JS];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('namo-shell-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  const own = url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
  if (!own && req.url !== SUPABASE_JS) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone()).catch(() => null);
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      return Response.error();
    }
  })());
});
