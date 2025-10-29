// ============================================================
//  SERVICE WORKER FOR YEAR 7 CUPS DASHBOARD
//  Provides offline support and caching for better performance
// ============================================================

const CACHE_NAME = 'year7-cups-v1.1.0';
const STATIC_CACHE = 'static-v1.1.0';
const DATA_CACHE = 'data-v1.1.0';
const RUNTIME_CACHE = 'runtime-v1.1.0';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/index.html',
  '/teamCard.html',
  '/brackets.html',
  '/style.css',
  '/script.js',
  '/manifest.webmanifest',
  // Add icon files when available
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Data files that should be cached but updated frequently
const DATA_FILES = [
  '/teams.json',
  '/welsh.json',
  '/cardiff.json',
  '/friendlies.json',
  '/last_updated.json'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      caches.open(DATA_CACHE).then((cache) => {
        console.log('[SW] Caching data files');
        return cache.addAll(DATA_FILES);
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // For data files, try network first, then cache
    if (DATA_FILES.some(file => pathname.endsWith(file))) {
      return await networkFirst(request, DATA_CACHE);
    }
    
    // For static files, try cache first, then network
    if (STATIC_FILES.some(file => pathname.endsWith(file)) || pathname === '/') {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // For other files, try network first with runtime caching
    return await networkFirst(request, RUNTIME_CACHE);
    
  } catch (error) {
    console.error('[SW] Error handling request:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE);
      return await cache.match('/index.html');
    }
    
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Serving from cache:', request.url);
    return cached;
  }
  
  console.log('[SW] Fetching from network:', request.url);
  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    console.log('[SW] Fetching from network:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// Background sync for data updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(updateData());
  }
});

async function updateData() {
  try {
    const cache = await caches.open(DATA_CACHE);
    
    for (const file of DATA_FILES) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          await cache.put(file, response);
          console.log('[SW] Updated cache for:', file);
        }
      } catch (error) {
        console.warn('[SW] Failed to update:', file, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Message handling for manual cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    event.waitUntil(updateData());
  }
});

console.log('[SW] Service worker script loaded');
