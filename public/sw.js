// Life OS Service Worker
// Version: 1.7.0
// Ensures proper MIME type and PWA functionality

const CACHE_NAME = "life-os-v1.7.0"
const STATIC_CACHE = "life-os-static-v1.7.0"
const DYNAMIC_CACHE = "life-os-dynamic-v1.7.0"

// Core files to cache immediately
const CORE_ASSETS = ["/", "/manifest.json", "/favicon.ico", "/icon-192x192.png", "/icon-512x512.png"]

// Install event - cache core assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker v1.7.0")

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching core assets")
        return cache.addAll(CORE_ASSETS)
      })
      .then(() => {
        console.log("[SW] Core assets cached successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[SW] Failed to cache core assets:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker v1.7.0")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Service Worker activated and ready")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle core assets with cache-first strategy
  if (CORE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches
        .match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[SW] Serving from cache:", url.pathname)
            return cachedResponse
          }

          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone()
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone))
            }
            return response
          })
        })
        .catch(() => {
          console.log("[SW] Failed to serve:", url.pathname)
          // Return offline fallback if available
          if (url.pathname === "/") {
            return caches.match("/")
          }
        }),
    )
    return
  }

  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok && response.type === "basic") {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Try to serve from cache when network fails
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[SW] Serving from cache (offline):", url.pathname)
            return cachedResponse
          }

          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/")
          }

          throw new Error("No cached version available")
        })
      }),
  )
})

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  let notificationData = {}

  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (error) {
      console.error("[SW] Error parsing push data:", error)
      notificationData = { title: "Life OS", body: event.data.text() || "New notification" }
    }
  }

  const title = notificationData.title || "Life OS"
  const options = {
    body: notificationData.body || "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: notificationData.tag || "default",
    data: notificationData.data || {},
    requireInteraction: false,
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/icon-192x192.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  }

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => {
        console.log("[SW] Notification displayed successfully")
      })
      .catch((error) => {
        console.error("[SW] Failed to show notification:", error)
      }),
  )
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action)

  event.notification.close()

  if (event.action === "dismiss") {
    return
  }

  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            console.log("[SW] Focusing existing window")
            return client.focus()
          }
        }

        // Open new window if none exists
        if (self.clients.openWindow) {
          console.log("[SW] Opening new window:", urlToOpen)
          return self.clients.openWindow(urlToOpen)
        }
      })
      .catch((error) => {
        console.error("[SW] Error handling notification click:", error)
      }),
  )
})

// Background sync event
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(
      Promise.resolve()
        .then(() => {
          console.log("[SW] Background sync completed")
        })
        .catch((error) => {
          console.error("[SW] Background sync failed:", error)
        }),
    )
  }
})

// Message event - handle messages from main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Skipping waiting...")
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: "1.7.0" })
  }
})

// Error event
self.addEventListener("error", (event) => {
  console.error("[SW] Service Worker error:", event.error)
})

// Unhandled rejection event
self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Unhandled promise rejection:", event.reason)
})

console.log("[SW] Service Worker script loaded successfully")
