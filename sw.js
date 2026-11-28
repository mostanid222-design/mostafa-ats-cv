const CACHE_NAME = 'mostafa-ats-cv-v20';
const ASSETS = ['./', './index.html', './ngo.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Stale-while-revalidate: opens instantaneously offline & updates quietly when online
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return resp;
        })
        .catch(() => null);

      if (cached) return cached;
      return networkFetch.then((resp) => {
        if (resp) return resp;
        if (url.pathname.endsWith('ngo.html')) return caches.match('./ngo.html');
        return caches.match('./index.html');
      });
    })
  );
});
