const CACHE_NAME = 'ninja-music-app-v7';
const APP_ASSETS = [
  './',
  './index.html',
  './hub.html',
  './rhythm_hub.html',
  './rhythm_practice.html',
  './rhythm_strike.html',
  './pitch_hub.html',
  './theory_vault.html',
  './piano_lab.html',
  './kids_ninja.html',
  './sensei_dash.html',
  './it_manager.html',
  './jarvis.js',
  './lms_core.js',
  './manifest.webmanifest',
  './icons/pitch-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const pathname = url.pathname || "";
  const isAuthSyncResource =
    pathname.endsWith('/shared_sync_packet.txt') ||
    pathname.endsWith('/shared_sync_packet.json');

  if (isAuthSyncResource) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
    return;
  }

  // HTML navigation should try network first, then fall back to cached page.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;
          const hubFallback = await caches.match('./hub.html');
          if (hubFallback) return hubFallback;
          return caches.match('./index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
