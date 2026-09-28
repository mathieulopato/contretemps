const CACHE = 'contretemps-v8';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

// cache: 'reload' skips the browser's HTTP cache, so a new version never stores stale files
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE)
    .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const put = res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  };
  // the page itself: network first, so an update shows on the next launch; cached copy when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(put).catch(() => caches.match(req).then(hit => hit || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(put)));
});
