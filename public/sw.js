/**
 * Service Worker - Cache First + Stale While Revalidate
 * Estrategia: Cache estático en install, network-first para HTML, cache-first para assets
 */

const CACHE_NAME = 'productivity-dashboard-v2';
// Archivos que existen en el build final (dist). Los assets de src/ se
// empaquetan con hashes en /assets/, así que se cachean en runtime (fetch),
// no aquí: precachearlos provocaría errores 404 en cada install.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-72.svg',
  '/icons/icon-96.svg',
  '/icons/icon-128.svg',
  '/icons/icon-144.svg',
  '/icons/icon-152.svg',
  '/icons/icon-192.svg',
  '/icons/icon-192.png',
  '/icons/icon-384.svg',
  '/icons/icon-512.svg',
  '/icons/icon-512.png'
];

// CDN assets que también cachear
const CDN_ASSETS = [
  'https://esm.sh/marked@12.0.0',
  'https://esm.sh/dompurify@3.0.8'
];

const ALL_ASSETS = [...STATIC_ASSETS, ...CDN_ASSETS];

// ============================================
// INSTALL - Cache estático
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Cache individual para manejar fallos de CDN
        return Promise.allSettled(
          ALL_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVATE - Limpiar caches antiguos
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// FETCH - Estrategia por tipo de recurso
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar GET
  if (request.method !== 'GET') return;
  
  // Ignorar requests cross-origin que no sean CDN conocidos
  if (url.origin !== location.origin && !CDN_ASSETS.some(cdn => url.href.startsWith(cdn))) {
    return;
  }
  
  // HTML: Network First (siempre intentar red para updates)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Assets estáticos (JS, CSS, imágenes): Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // CDN libraries: Cache First con fallback network
  if (CDN_ASSETS.some(cdn => url.href.startsWith(cdn))) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Default: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ============================================
// ESTRATEGIAS
// ============================================

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // Background update
    fetch(request).then(response => {
      if (response.ok) cache.put(request, response.clone());
    }).catch(() => {});
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    
    // Fallback offline page
    return caches.match('/index.html') || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt)$/i.test(pathname);
}

// ============================================
// MENSAJES DESDE CLIENTE
// ============================================

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data === 'clearCache') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

// ============================================
// NOTIFICACIONES PUSH (futuro)
// ============================================

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(event.notification.data);
      })
    );
  }
});
