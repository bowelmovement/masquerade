const CACHE_VERSION = 40;
const CURRENT_CACHES = { prefetch: `prefetch-cache-v${CACHE_VERSION}` };
const URLS_TO_PREFETCH = [
  './manifest.json',
  './android.html',
  './screen-android.mp4',
  './AppIcon60x60.png',
  './AppIcon60x60-2x.png'
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
  const { request, request: { headers, url } } = event;
  console.log('Handling fetch event for', url);

  const range = headers.get('range');
  if (range) {
    const pos = Number(/^bytes\=(\d+)\-$/g.exec(range)[1]);
    console.log(`Range request for ${url}, starting position: ${pos}`);

    event.respondWith((async () => {
      const cache = await caches.open(CURRENT_CACHES.prefetch);
      const cachedResponse = await cache.match(url);
      if (!cachedResponse) {
        console.log('!!!Cache Miss!!!');
      }
      const ab = await (cachedResponse || (await fetch(request))).arrayBuffer();
      console.log(`Range respond with ${ab.slice(pos).byteLength} bytes`);
      return new Response(
        ab.slice(pos),
        {
          status: 206,
          statusText: 'Partial Content',
          headers: [
            ['Content-Range', `bytes ${pos}-${ab.byteLength - 1}/${ab.byteLength}`]
          ]
        }
      );
    })());
  } else {
    console.log('Non-range request for', url);
    event.respondWith((async () =>
      (await caches.match(request)) || (await fetch(request))
    )());
  }
});
