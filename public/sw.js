// Life OS Service Worker
// Version: 1.8.0 - Enhanced Notification Support

const CACHE_NAME = "life-os-v1.8.0"
const STATIC_CACHE = "life-os-static-v1.8.0"
const DYNAMIC_CACHE = "life-os-dynamic-v1.8.0"

// Core files to cache immediately
const CORE_ASSETS = ["/", "/manifest.json", "/favicon.ico", "/icon-192x192.png", "/icon-512x512.png"]

// Install event - cache core assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker v1.8.0")

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
  console.log("[SW] Activating Service Worker v1.8.0")

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

// Push notification event - Enhanced with proper error handling
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received:", event)

  let notificationData = {
    title: "Life OS",
    body: "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: "default",
    data: {},
    requireInteraction: false,
    silent: false,
    timestamp: Date.now(),
  }

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json()
      console.log("[SW] Push data received:", pushData)

      notificationData = {
        ...notificationData,
        ...pushData,
        // Ensure required fields are present
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        tag: pushData.tag || `notification-${Date.now()}`,
        data: pushData.data || {},
        requireInteraction: pushData.requireInteraction || false,
        silent: pushData.silent || false,
        timestamp: pushData.timestamp || Date.now(),
      }
    } catch (error) {
      console.error("[SW] Error parsing push data:", error)
      // Use text data as body if JSON parsing fails
      if (event.data.text) {
        notificationData.body = event.data.text()
      }
    }
  }

  // Enhanced notification options
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    timestamp: notificationData.timestamp,
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
    // Additional options for better UX
    vibrate: [100, 50, 100],
    renotify: true,
    sticky: false,
  }

  console.log("[SW] Showing notification with options:", notificationOptions)

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationOptions)
      .then(() => {
        console.log("[SW] Notification displayed successfully")

        // Send confirmation back to clients
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "NOTIFICATION_SHOWN",
              notification: notificationData,
            })
          })
        })
      })
      .catch((error) => {
        console.error("[SW] Failed to show notification:", error)

        // Send error back to clients
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "NOTIFICATION_ERROR",
              error: error.message,
            })
          })
        })
      }),
  )
})

// Notification click event - Enhanced with action handling
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action, event.notification)

  event.notification.close()

  // Handle different actions
  if (event.action === "dismiss") {
    console.log("[SW] Notification dismissed")
    return
  }

  // Default action or "view" action
  const urlToOpen = event.notification.data?.url || "/"
  const notificationData = {
    tag: event.notification.tag,
    data: event.notification.data,
    action: event.action || "default",
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            console.log("[SW] Focusing existing window")
            // Send notification click data to the focused window
            client.postMessage({
              type: "NOTIFICATION_CLICKED",
              notification: notificationData,
            })
            return client.focus()
          }
        }

        // Open new window if none exists
        if (self.clients.openWindow) {
          console.log("[SW] Opening new window:", urlToOpen)
          return self.clients.openWindow(urlToOpen).then((newClient) => {
            // Send notification click data to the new window
            if (newClient) {
              newClient.postMessage({
                type: "NOTIFICATION_CLICKED",
                notification: notificationData,
              })
            }
            return newClient
          })
        }
      })
      .catch((error) => {
        console.error("[SW] Error handling notification click:", error)
      }),
  )
})

// Background sync event - Enhanced
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(
      Promise.resolve()
        .then(() => {
          console.log("[SW] Background sync completed")

          // Notify clients about sync completion
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "SYNC_COMPLETED",
                tag: event.tag,
              })
            })
          })
        })
        .catch((error) => {
          console.error("[SW] Background sync failed:", error)
        }),
    )
  }

  // Handle notification sync
  if (event.tag === "notification-sync") {
    event.waitUntil(
      self.registration
        .showNotification("Background Sync", {
          body: "Data has been synchronized in the background",
          icon: "/icon-192x192.png",
          tag: "sync-notification",
        })
        .then(() => {
          console.log("[SW] Sync notification shown")
        })
        .catch((error) => {
          console.error("[SW] Failed to show sync notification:", error)
        }),
    )
  }
})

// Message event - Enhanced with notification testing
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Skipping waiting...")
    self.skipWaiting()
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: "1.8.0" })
  }

  // Handle test notification request
  if (event.data && event.data.type === "TEST_NOTIFICATION") {
    console.log("[SW] Test notification requested")

    const testNotificationData = {
      title: event.data.title || "Test Notification",
      body: event.data.body || "This is a test notification from Life OS!",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "test-notification",
      data: { test: true, timestamp: Date.now() },
      requireInteraction: false,
      silent: false,
    }

    const notificationOptions = {
      body: testNotificationData.body,
      icon: testNotificationData.icon,
      badge: testNotificationData.badge,
      tag: testNotificationData.tag,
      data: testNotificationData.data,
      requireInteraction: testNotificationData.requireInteraction,
      silent: testNotificationData.silent,
      vibrate: [200, 100, 200],
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

    self.registration
      .showNotification(testNotificationData.title, notificationOptions)
      .then(() => {
        console.log("[SW] Test notification shown successfully")
        event.ports[0].postMessage({
          success: true,
          message: "Test notification shown successfully",
        })
      })
      .catch((error) => {
        console.error("[SW] Failed to show test notification:", error)
        event.ports[0].postMessage({
          success: false,
          error: error.message,
        })
      })
  }

  // Handle notification permission check
  if (event.data && event.data.type === "CHECK_NOTIFICATION_PERMISSION") {
    // Note: Service workers can't directly check Notification.permission
    // This needs to be handled by the main thread
    event.ports[0].postMessage({
      message: "Notification permission check must be done from main thread",
    })
  }
})

// Error event - Enhanced logging
self.addEventListener("error", (event) => {
  console.error("[SW] Service Worker error:", event.error, event.filename, event.lineno)

  // Send error to clients for debugging
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "SW_ERROR",
        error: {
          message: event.error?.message || "Unknown error",
          filename: event.filename,
          lineno: event.lineno,
        },
      })
    })
  })
})

// Unhandled rejection event - Enhanced logging
self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Unhandled promise rejection:", event.reason)

  // Send rejection to clients for debugging
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "SW_UNHANDLED_REJECTION",
        reason: event.reason?.message || event.reason,
      })
    })
  })
})

console.log("[SW] Service Worker v1.8.0 script loaded successfully with enhanced notification support")
