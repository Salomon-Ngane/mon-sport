const CACHE_NAME = 'mon-sport-v2'; // Version du cache incrémentée

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './mon-sport/default.jpg',
    './mon-sport/jumping-jacks.jpg',
    './mon-sport/squats.jpg',
    './mon-sport/pompes.jpg',
    './mon-sport/fentes.jpg',
    './mon-sport/gainage.jpg'
];

// Installation : Mise en cache des ressources statiques et visuels
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activation : Suppression des anciens caches (ex: mon-sport-v1)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interception des requêtes : Network-First avec fallback sur le Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si la mise à jour réseau réussit, on met à jour le cache dynamiquement
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // En cas d'absence de réseau (Offline), retour du cache
                return caches.match(event.request);
            })
    );
});
