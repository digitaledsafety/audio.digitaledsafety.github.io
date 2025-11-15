const CACHE_NAME = 'web-audio-playground-cache-v1';
const urlsToCache = [
  '/audio/',
  '/audio/manifest.json',
  '/audio/icons/icon-192x192.png',
  '/audio/icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/rete@2.0.0-beta.6/rete.min.js',
  'https://unpkg.com/react-is@17.0.2/umd/react-is.production.min.js',
  'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
  'https://unpkg.com/styled-components@5.2.3/dist/styled-components.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/rete-area-plugin@2.0.0-beta.8/rete-area-plugin.min.js',
  'https://cdn.jsdelivr.net/npm/rete-render-utils@2.0.0-beta.8/rete-render-utils.min.js',
  'https://cdn.jsdelivr.net/npm/rete-react-render-plugin@2.0.0-beta.9/rete-react-render-plugin.min.js',
  'https://cdn.jsdelivr.net/npm/rete-connection-plugin@2.0.0-beta.7/rete-connection-plugin.min.js',
  'https://cdn.jsdelivr.net/npm/rete-context-menu-plugin@2.0.0-beta.6/rete-context-menu-plugin.min.js',
  'https://cdn.jsdelivr.net/npm/rete-engine@2.0.0-beta.7/rete-engine.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            // Check if we received a valid response to cache.
            // We don't cache opaque responses (type 'opaque') for cross-origin requests
            // without CORS headers, as their status is 0, which fails this check.
            if(!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
