/* Service worker — Tour d'Asie
   1) Notifications push (appli fermée)
   2) Mode hors-ligne : met en cache l'appli + ses ressources pour consulter sans réseau */
importScripts('security.js');
const CACHE = 'voyages-v19';

/* Ressources internes (même domaine) */
const CORE = [
  './', 'index.html', 'manifest.json', 'vols.html',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'security.js', 'vendor/dompurify-3.4.16.min.js'
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
    try { await c.addAll(CORE.map(u => new Request(u, {cache:'reload'}))); } catch (err) {}
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
  // Les tuiles utilisent le cache HTTP du navigateur. Ne pas garder durablement
  // une image d'erreur du fournisseur dans le cache hors-ligne de l'application.
  if(h === 'tile.openstreetmap.org' || h.endsWith('.basemaps.cartocdn.com'))return;
  if (h.indexOf('googleapis.com') >= 0 || h.indexOf('firebaseio.com') >= 0 ||
      h.indexOf('firebasedatabase.app') >= 0 || h.indexOf('identitytoolkit') >= 0 ||
      h.indexOf('securetoken') >= 0 || h.indexOf('google-analytics') >= 0 ||
      h.indexOf('er-api.com') >= 0) {
    return; // laisse passer au réseau (Firebase + taux de change gèrent l'offline eux-mêmes)
  }

  /* Page (navigation) : réseau d'abord (pour avoir les mises à jour), sinon cache */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(new Request(req, {cache:'no-store'})).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return r;
      }).catch(async () => (await caches.match(req, {ignoreSearch:true})) || (await caches.match('index.html')) || (await caches.match('./')))
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
    data: { url: TravelSecurity.notificationURL(data.url, self.registration.scope) },
    vibrate: [80, 40, 80]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = TravelSecurity.notificationURL(e.notification.data && e.notification.data.url, self.registration.scope);
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if (new URL(c.url).origin===self.location.origin && c.url.includes('/voyages/') && 'focus' in c) {return c.navigate(url).then(()=>c.focus());} }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
