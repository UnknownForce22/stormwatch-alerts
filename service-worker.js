// StormWatch Service Worker
// Caches the app shell (HTML/CSS/JS) for instant offline load
// All weather API calls always go to network - never serve stale weather data

const CACHE_NAME = 'stormwatch-v1';
const CACHE_URLS = [
  './index.html',
  './manifest.json'
];

// Live weather API domains - NEVER cache these
const LIVE_DOMAINS = [
  'api.open-meteo.com',
  'geocoding-api.open-meteo.com',
  'api.weather.gov',
  'api.rainviewer.com',
  'mapservices.weather.noaa.gov',
  'mesonet.agron.iastate.edu',
  'nominatim.openstreetmap.org',
  'stormwatch-alerts.vercel.app'
];

// Install - cache app shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first for live APIs, cache first for app shell
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Always go to network for live weather data
  var isLive = LIVE_DOMAINS.some(function(d) { return url.hostname.includes(d); });
  if (isLive) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(JSON.stringify({ error: 'Offline - no live data available' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // App shell - cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        // Cache new resources as we fetch them
        if (response.ok && event.request.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      });
    }).catch(function() {
      // Offline fallback for HTML pages
      if (event.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});
