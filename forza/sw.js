// forza · Hülle für die Installation auf dem Homescreen. Immer zuerst das Netz, Zwischenspeicher nur als Rückfall.
// Anfragen an Supabase und Strava werden nie zwischengespeichert.
const CACHE = 'forza-shell-v9';
const SHELL = ['./', './index.html', './forza.css', './config.js', './texts.js', './engine.js', './core.js', './ui-main.js', './ui-train.js', './ui-more.js', './ui-extra.js', './ui-extra2.js', './ui-fx.js', './boot.js', './manifest.webmanifest', './assets/forza.svg', './assets/forza-180.png'];
self.addEventListener('install', (e) => { e.waitUntil((async () => { const c = await caches.open(CACHE); await Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => null))); await self.skipWaiting(); })()); });
self.addEventListener('activate', (e) => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith('forza-shell-') && k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url), scope = new URL(self.registration.scope);
  if (!(url.origin === scope.origin && url.pathname.startsWith(scope.pathname))) return;
  e.respondWith((async () => { try { const res = await fetch(req, { cache: 'no-cache' }); if (res && res.ok) (await caches.open(CACHE)).put(req, res.clone()).catch(() => null); return res; } catch { const hit = await caches.match(req, { ignoreSearch: true }); if (hit) return hit; if (req.mode === 'navigate') return (await caches.match('./index.html')) || Response.error(); return Response.error(); } })());
});
