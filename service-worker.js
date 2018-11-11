const CACHE_VERSION = 29;
const CURRENT_CACHES = { prefetch: `prefetch-cache-v${CACHE_VERSION}` };
const URLS_TO_PREFETCH = [
  './android.html',
  './screen-android.mp4'
];

self.addEventListener('install', event => {
  console.log('Handling install event. Resources to prefetch:', URLS_TO_PREFETCH);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CURRENT_CACHES.prefetch).then(cache =>
      cache.addAll(URLS_TO_PREFETCH)
    )
  );
});

self.addEventListener('activate', event => {
  const expectedCacheNames = Object.values(CURRENT_CACHES);
  event.waitUntil((async () => {
    for (const cacheName of (await caches.keys())) {
      if (!expectedCacheNames.includes(cacheName)) {
        console.log('Deleting out of date cache:', cacheName),
        await caches.delete(cacheName);
      }
    }
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  console.log('Handling fetch event for', request.url);
  event.respondWith((async () =>
    (await caches.match(request)) || (await fetch(request))
  )());
});
