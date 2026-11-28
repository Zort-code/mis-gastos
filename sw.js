/* Mis Gastos V2 · service worker: solo caché de la propia app (nunca datos financieros, que viven cifrados en localStorage/IndexedDB). */
const VERSION = 'mis-gastos-v2.0.0';
const ASSETS = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(ASSETS.map(u => c.add(new Request(u, { cache: 'reload' })).catch(err => { if (!u.endsWith('.png')) throw err; })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mis-gastos-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // nunca intercepta otros orígenes
  if (req.mode === 'navigate') {
    // Red primero para recibir actualizaciones; sin conexión, la app cacheada.
    e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); } return r; })
      .catch(() => caches.match('./index.html', { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
