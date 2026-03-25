const CACHE = 'mf-rappels-v1';
const ASSETS = [
  '/motors-factory-rappels/',
  '/motors-factory-rappels/index.html',
  '/motors-factory-rappels/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
