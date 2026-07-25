const CACHE = "dollhouse-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./hotel-intro.mp4",
  "./hotel-exterior.png",
  "./hotel-lobby.png",
  "./avatar.png",
  "./avatar-talking.gif",
  "./boss.png",
  "./boss-talking.gif",
  "./image1_bottom.png",
  "./image2_bottom.png",
  "./cleaning-supplies.png",
  "./inventory.json",
  "./tasks.json"
];

// Pre-cache everything on install
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for media/images, network-first for JSON (so task updates propagate)
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  const isJson = url.pathname.endsWith(".json");

  if (isJson) {
    // Network first, fall back to cache
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache first, fall back to network and cache the result
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
  }
});
