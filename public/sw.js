/* eslint-env serviceworker */
// Version 3.0.4 - Rescue Update
const CACHE_NAME = 'lautech-market-v3.0.4';
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

    // Check if it's a navigation request (HTML page)
    const isNavigation = event.request.mode === 'navigate';

    // 1. Navigation (HTML): Network First, fall back to Cache
    if (isNavigation) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 2. Scripts: Network First to avoid hash mismatches
    if (isScript) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // 3. Other Assets (Images, fonts, etc.): Cache First, fall back to Network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
