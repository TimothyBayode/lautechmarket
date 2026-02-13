/* eslint-env serviceworker */
// Version 2 - Forced Update
const CACHE_NAME = 'lautech-market-v3';
const ASSETS_TO_CACHE = [
    '/logo_icon.png',
    '/logo_text.png',
    '/site.webmanifest'
];

self.addEventListener('install', (event) => {
    // Skip waiting to ensure this version takes over immediately
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Immediately claim clients to ensure we control the current page
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Clear old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('Clearing old cache:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // Check if the request is for a script/module
    const isScript = event.request.destination === 'script';

    // For scripts, always try network first to avoid "MIME type" errors with stale hashes
    if (isScript) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
