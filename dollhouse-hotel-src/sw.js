const CACHE = "dollhouse-v4";
const ASSETS = [
  "./hotel-intro.mp4",
  "./hotel-exterior.png",
  "./hotel-lobby.png",
  "./avatar.png",
  "./avatar-talking.gif",
  "./boss.png",
  "./boss-talking.gif",
  "./image1_bottom.png",
  "./image2_bottom.png",
  "./cleaning-supplies.png"
];

// Pre-cache media/images on install (NOT index.html — always fetch fresh)
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

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  const isHtml = url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  const isJson = url.pathname.endsWith(".json");

  if (isHtml || isJson) {
    // Always network-first for HTML and JSON so updates propagate immediately
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (isJson) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for media/images
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
