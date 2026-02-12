const CACHE_NAME = 'silentsuite';

// Daftar aset vital yang harus tersedia Offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    // External Libraries (CDN) - Penting untuk Offline
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/pdf-lib/dist/pdf-lib.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js',
    'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.0/dist/browser-image-compression.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// 1. Install Event: Cache semua aset awal
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Paksa SW baru segera aktif
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching offline assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate Event: Bersihkan cache lama (PENTING untuk update versi)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[ServiceWorker] Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Ambil alih kontrol halaman segera
});

// 3. Fetch Event: Strategi Hybrid
self.addEventListener('fetch', (event) => {
    // A. Strategi untuk HTML (Navigasi): Network First, Fallback to Cache
    // Agar user selalu dapat versi terbaru jika online.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // Jika offline, ambil index.html dari cache
                    return caches.match('./index.html');
                })
        );
        return;
    }

    // B. Strategi untuk Aset Statis (JS/CSS/Img): Cache First, Fallback to Network
    // Agar loading super cepat & hemat data.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((response) => {
                // Cek validitas response
                if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                    return response;
                }
                // Cache aset baru yang belum ada
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            });
        })
    );
});
