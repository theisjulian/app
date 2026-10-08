/* Gruppen – Offline-Zwischenspeicher (nur App-Dateien, keine Schülerdaten) */
const CACHE = 'gruppen-v1.0.3b';
const FILES = ['./app.html', './manifest.webmanifest', './fonts/inter-latin-opsz-normal.woff2', './fonts/inter-latin-ext-opsz-normal.woff2', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
