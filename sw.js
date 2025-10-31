// ============================================================
//  SERVICE WORKER FOR YEAR 7 CUPS DASHBOARD
//  What this file does (simple overview):
//  - Pre-caches important files so the app works offline
//  - Uses different strategies to serve files fast (cache-first / network-first)
//  - Periodically cleans and limits caches to save space
//  - Can refresh JSON data in the background (Background Sync)
//
//  How to debug quickly:
//  - Look for lines marked with "DEBUG:" and remove the slashes to enable extra logs
//  - Use Application > Service Workers in DevTools to inspect state
// ============================================================

const CACHE_VERSION = "2.0.2";
const CACHE_NAME = `year7-cups-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Cache size limits
const CACHE_LIMITS = {
  STATIC: 50, // MB
  DATA: 10, // MB
  RUNTIME: 20, // MB
};

// Files to cache for offline use
const STATIC_FILES = [
  "/",
  "/index.html",
  "/teamCard.html",
  "/brackets.html",
  "/style.css",
  "/script.js",
  "/admin.js",
  "/translations.js",
  "/manifest.webmanifest",
];

// Data files that should be cached but updated frequently
const DATA_FILES = [
  "/teams.json",
  "/welsh.json",
  "/cardiff.json",
  "/friendlies.json",
  "/last_updated.json",
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Calculate cache size
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  let size = 0;

  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      size += blob.size;
    }
  }

  return size / (1024 * 1024); // Return size in MB
}

// Clean old caches
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, DATA_CACHE, RUNTIME_CACHE];

  for (const cacheName of cacheNames) {
    if (!currentCaches.includes(cacheName)) {
      await caches.delete(cacheName);
      console.log(`Deleted old cache: ${cacheName}`);
      // DEBUG: list remaining caches
      // console.log('Remaining caches', await caches.keys());
    }
  }
}

// Manage cache size
async function manageCacheSize(cacheName, limit) {
  const size = await getCacheSize(cacheName);
  if (size > limit) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    // Remove oldest entries (simple FIFO strategy)
    const entriesToRemove = Math.floor(keys.length * 0.3); // Remove 30%
    for (let i = 0; i < entriesToRemove; i++) {
      await cache.delete(keys[i]);
    }

    console.log(
      `Cleaned cache ${cacheName}: removed ${entriesToRemove} entries`
    );
  }
}

// Check if request should be cached
function shouldCache(request) {
  const url = new URL(request.url);

  // Don't cache external requests
  if (url.origin !== location.origin) {
    return false;
  }

  // Don't cache POST requests
  if (request.method !== "GET") {
    return false;
  }

  return true;
}

// Get cache strategy for request
function getCacheStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (STATIC_FILES.some((file) => pathname.endsWith(file))) {
    return "static";
  }

  if (DATA_FILES.some((file) => pathname.endsWith(file))) {
    return "data";
  }

  return "runtime";
}

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing service worker v${CACHE_VERSION}...`, {
    timestamp: new Date().toISOString(),
    cacheVersion: CACHE_VERSION,
    staticFiles: STATIC_FILES.length,
    dataFiles: DATA_FILES.length,
  });

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(async (cache) => {
        console.log("[SW] Caching static files", {
          cacheName: STATIC_CACHE,
          files: STATIC_FILES,
          timestamp: new Date().toISOString(),
        });
        try {
          const startTime = Date.now();
          await cache.addAll(STATIC_FILES);
          const duration = Date.now() - startTime;
          console.log(`[SW] Cached ${STATIC_FILES.length} static files`, {
            duration: `${duration}ms`,
            cacheName: STATIC_CACHE,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.warn("[SW] Some static files failed to cache:", {
            error: error.message,
            failedFiles: STATIC_FILES.filter((file) => {
              // This is a simplified check - in reality we'd need to track which specific files failed
              return true;
            }),
            timestamp: new Date().toISOString(),
          });
          // DEBUG: Inspect which file caused issues
          // console.warn('[SW] static list', STATIC_FILES);
        }
      }),
      caches.open(DATA_CACHE).then(async (cache) => {
        console.log("[SW] Caching data files", {
          cacheName: DATA_CACHE,
          files: DATA_FILES,
          timestamp: new Date().toISOString(),
        });
        try {
          const startTime = Date.now();
          await cache.addAll(DATA_FILES);
          const duration = Date.now() - startTime;
          console.log(`[SW] Cached ${DATA_FILES.length} data files`, {
            duration: `${duration}ms`,
            cacheName: DATA_CACHE,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.warn("[SW] Some data files failed to cache:", {
            error: error.message,
            failedFiles: DATA_FILES.filter((file) => {
              // This is a simplified check - in reality we'd need to track which specific files failed
              return true;
            }),
            timestamp: new Date().toISOString(),
          });
          // DEBUG: Inspect data files list
          // console.warn('[SW] data list', DATA_FILES);
        }
      }),
    ])
      .then(() => {
        console.log("[SW] Installation complete", {
          timestamp: new Date().toISOString(),
          totalCaches: 2,
          staticFilesCached: STATIC_FILES.length,
          dataFilesCached: DATA_FILES.length,
        });
        // Don't automatically skip waiting to prevent page reloads
        // The service worker will activate on next page load
        return;
      })
      .catch((error) => {
        console.error("[SW] Installation failed:", {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating service worker v${CACHE_VERSION}...`);

  event.waitUntil(
    Promise.all([cleanOldCaches(), self.clients.claim()])
      .then(() => {
        console.log("[SW] Activation complete");

        // Manage cache sizes
        return Promise.all([
          manageCacheSize(STATIC_CACHE, CACHE_LIMITS.STATIC),
          manageCacheSize(DATA_CACHE, CACHE_LIMITS.DATA),
          manageCacheSize(RUNTIME_CACHE, CACHE_LIMITS.RUNTIME),
        ]);
      })
      .then(() => {
        console.log("[SW] Cache management complete");
      })
      .catch((error) => {
        console.error("[SW] Activation failed:", error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Check if request should be cached
  if (!shouldCache(request)) {
    return;
  }

  event.respondWith(
    handleRequest(request).catch((error) => {
      console.error("[SW] Fetch failed:", error);
      // DEBUG: Show failing URL
      // console.error('[SW] failed URL:', request.url);

      // Return offline page for navigation requests
      if (request.mode === "navigate") {
        return caches.match("/index.html");
      }

      // Return a basic error response for other requests
      return new Response("Offline", {
        status: 503,
        statusText: "Service Unavailable",
        headers: new Headers({
          "Content-Type": "text/plain",
        }),
      });
    })
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const strategy = getCacheStrategy(request);

  try {
    switch (strategy) {
      case "static":
        return await cacheFirst(request, STATIC_CACHE);

      case "data":
        return await networkFirst(request, DATA_CACHE);

      case "runtime":
      default:
        return await networkFirst(request, RUNTIME_CACHE);
    }
  } catch (error) {
    console.error("[SW] Error handling request:", error);

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const cache = await caches.open(STATIC_CACHE);
      return await cache.match("/index.html");
    }

    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    console.log(`[SW] Cache hit (${cacheName}):`, {
      url: request.url,
      cacheName: cacheName,
      strategy: "cache-first",
      timestamp: new Date().toISOString(),
    });
    return cached;
  }

  console.log(`[SW] Cache miss (${cacheName}), fetching from network:`, {
    url: request.url,
    cacheName: cacheName,
    strategy: "cache-first",
    timestamp: new Date().toISOString(),
  });

  const startTime = Date.now();
  const response = await fetch(request);
  const fetchDuration = Date.now() - startTime;

  if (response.ok) {
    // Clone response before caching
    const responseToCache = response.clone();
    const cacheStartTime = Date.now();
    await cache.put(request, responseToCache);
    const cacheDuration = Date.now() - cacheStartTime;

    console.log(`[SW] Cached response (${cacheName}):`, {
      url: request.url,
      cacheName: cacheName,
      fetchDuration: `${fetchDuration}ms`,
      cacheDuration: `${cacheDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      status: response.status,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.warn(`[SW] Failed to fetch and cache (${cacheName}):`, {
      url: request.url,
      cacheName: cacheName,
      status: response.status,
      statusText: response.statusText,
      fetchDuration: `${fetchDuration}ms`,
      timestamp: new Date().toISOString(),
    });
  }

  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    console.log(`[SW] Network first (${cacheName}):`, request.url);
    const response = await fetch(request);

    if (response.ok) {
      // Clone response before caching
      const responseToCache = response.clone();
      cache.put(request, responseToCache);
      console.log(`[SW] Cached response (${cacheName}):`, request.url);
      // DEBUG: Inspect header(s)
      // console.log('[SW] headers', Array.from(response.headers.entries()));
    }

    return response;
  } catch (error) {
    console.log(
      `[SW] Network failed, trying cache (${cacheName}):`,
      request.url
    );
    const cached = await cache.match(request);

    if (cached) {
      console.log(`[SW] Cache hit (${cacheName}):`, request.url);
      return cached;
    }

    console.log(`[SW] No cache available (${cacheName}):`, request.url);
    throw error;
  }
}

// Background sync for data updates
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("[SW] Background sync triggered");
    event.waitUntil(updateData());
  }
});

// Update data in background
async function updateData() {
  try {
    const cache = await caches.open(DATA_CACHE);

    // Update data files
    for (const file of DATA_FILES) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          await cache.put(file, response);
          console.log(`[SW] Updated ${file} in background`);
        }
      } catch (error) {
        console.warn(`[SW] Failed to update ${file}:`, error);
      }
    }
  } catch (error) {
    console.error("[SW] Background sync failed:", error);
  }
}

// Handle messages from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    // Don't automatically skip waiting to prevent page reloads
    console.log(
      "[SW] Skip waiting message received, but not acting on it to prevent reloads"
    );
  }
});

console.log("[SW] Service Worker script loaded");
