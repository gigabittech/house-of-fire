// House of Fire — Service Worker
// Strategy: network-first for pages, API, and /_next/static; cache-first for images/fonts.

const CACHE = 'hof-v3';

const PRECACHE = [
  '/',
  '/event',
  '/archive',
  '/live',
  // COMMUNITY_FEATURE: restore '/community' when enabling Community (features.ts).
  '/profile',
  '/ticket',
  '/manifest.webmanifest',
  '/offline',
];

// On install — precache app shell pages
self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

// On activate — clean up old caches
self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// Fetch — network-first with cache fallback
self.addEventListener('fetch', (ev) => {
  const { request } = ev;

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Next.js build chunks — network-first so deploys/HMR aren't stuck on old JS.
  if (url.pathname.startsWith('/_next/static/')) {
    ev.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Fonts, images, public assets — cache-first
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(woff2?|ttf|png|jpg|jpeg|svg|ico|webp)$/)
  ) {
    ev.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(request, clone));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Pages / API — network-first, cache fallback
  ev.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.destination === 'document') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(request)
          .then(
            (cached) =>
              cached ?? (request.destination === 'document' ? caches.match('/offline') : undefined),
          ),
      ),
  );
});

self.addEventListener('push', (ev) => {
  if (!ev.data) return;
  const data = ev.data.json();
  const title = data.title ?? 'House of Fire';
  const options = {
    body: data.body ?? '',
    icon: '/assets/hof-logo-color.png',
    badge: '/assets/hof-logo-color.png',
    tag: data.tag ?? 'hof-notification',
    data: { url: data.url ?? '/' },
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction ?? false,
  };
  ev.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  const url = ev.notification.data?.url ?? '/';
  ev.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const existing = cs.find((c) => c.url.includes(self.location.origin) && 'focus' in c);
      if (existing) {
        existing.focus();
        existing.navigate(url);
        return;
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
