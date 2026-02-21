/* eslint-env serviceworker */
// Version 3.2.0 - SW Cache Fix (network-first for all Vite bundles)
const CACHE_NAME = 'lautech-market-v3.2.0';
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
            // Clear ALL old caches so stale Vite bundles are fully purged
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('[SW] Clearing old cache:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // 1. Navigation (HTML pages): Network First, fallback to Cache
    //    This prevents stale index.html from being served to returning users.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // 2. Vite-hashed JS/CSS bundles (/assets/): Network First
    //    CRITICAL: Vite uses content-hashed filenames (e.g. index-abc123.js).
    //    After every deployment these hashes change, so old cached bundles
    //    become 404s. Always fetch fresh from the network.
    if (url.includes('/assets/')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // 3. Script/module requests (any destination='script'): Network First
    if (event.request.destination === 'script') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // 4. Static assets (Images, icons, fonts, manifest): Cache First
    //    These are stable files that don't change with builds.
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
