/* Service worker — Tour d'Asie
   1) Notifications push (appli fermée)
   2) Mode hors-ligne : met en cache l'appli + ses ressources pour consulter sans réseau */
const CACHE = 'voyages-v3';

/* Ressources internes (même domaine) */
const CORE = [
  './', 'index.html', 'manifest.json', 'vols.html',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];
/* Librairies externes (carte + Firebase) — mises en cache pour marcher hors-ligne */
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js',
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    try { await c.addAll(CORE); } catch (err) {}
    // les CDN en "best effort" (réponses opaques, on ignore les échecs)
    await Promise.all(CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  /* Appels réseau Firebase (auth + base de données) : toujours le réseau, jamais le cache */
  const h = url.hostname;
  if (h.indexOf('googleapis.com') >= 0 || h.indexOf('firebaseio.com') >= 0 ||
      h.indexOf('firebasedatabase.app') >= 0 || h.indexOf('identitytoolkit') >= 0 ||
      h.indexOf('securetoken') >= 0 || h.indexOf('google-analytics') >= 0 ||
      h.indexOf('er-api.com') >= 0) {
    return; // laisse passer au réseau (Firebase + taux de change gèrent l'offline eux-mêmes)
  }

  /* Page (navigation) : réseau d'abord (pour avoir les mises à jour), sinon cache */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return r;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('index.html') || caches.match('./')))
    );
    return;
  }

  /* Autres ressources (icônes, carte, Firebase SDK, images…) : cache d'abord, réseau sinon */
  e.respondWith(
    caches.match(req).then(m => m || fetch(req).then(r => {
      if (r && (r.status === 200 || r.type === 'opaque')) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return r;
    }).catch(() => m))
  );
});

/* ===== Notifications push ===== */
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; }
  catch (err) { data = { title: "Tour d'Asie", body: e.data ? e.data.text() : '' }; }
  const title = data.title || "Tour d'Asie";
  const options = {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: data.tag || 'tourdasie',
    renotify: true,
    data: { url: data.url || './' },
    vibrate: [80, 40, 80]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
