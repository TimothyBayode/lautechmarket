// Minimal service worker for PWA compliance
const CACHE_NAME = 'lautech-market-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/logo.svg',
    '/site.webmanifest'
];

self.addEventListener('install', (event) => {
    (event as any).waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    (event as any).respondWith(
        caches.match((event as any).request).then((response) => {
            return response || fetch((event as any).request);
        })
    );
});
