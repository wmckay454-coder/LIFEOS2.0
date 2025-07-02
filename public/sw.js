/* LIFE OS - Progressive Web App Service Worker */
/* Handles caching, background sync, and push notifications */

const CACHE_NAME = "life-os-cache-v1.2.0"
const STATIC_CACHE = "life-os-static-v1.2.0"
const RUNTIME_CACHE = "life-os-runtime-v1.2.0"

// Core assets to cache immediately
const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.ico", "/icon-192x192.png", "/icon-512x512.png"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...")

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log("[SW] Static assets cached")
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, RUNTIME_CACHE].includes(cacheName)) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Cache cleanup complete")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests from same origin
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return
  }

  // Static assets - cache first
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached
        }
        return fetch(request).then((response) => {
          const responseClone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone))
          return response
        })
      }),
    )
    return
  }

  // Everything else - network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200 && response.type === "basic") {
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone))
        }
        return response
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(request).then((cached) => {
          if (cached) {
            return cached
          }
          // Last resort - return offline page
          return caches.match("/")
        })
      }),
  )
})

// Background sync for data synchronization
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag)

  if (event.tag === "background-sync-data") {
    event.waitUntil(syncUserData())
  }

  if (event.tag === "background-sync-habits") {
    event.waitUntil(syncHabits())
  }

  if (event.tag === "background-sync-notifications") {
    event.waitUntil(syncNotifications())
  }
})

// Push notification handler
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  let notificationData = {
    title: "Life OS",
    body: "You have a new notification",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: "default",
    data: { url: "/" },
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (error) {
      console.error("[SW] Error parsing push data:", error)
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: false,
    vibrate: [100, 50, 100],
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/icon-192x192.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
        icon: "/icon-192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, options))
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action)

  event.notification.close()

  if (event.action === "dismiss") {
    return
  }

  const url = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus()
        }
      }
      // Open new window if not already open
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    }),
  )
})

// Message handler for communication with main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data?.type === "SCHEDULE_NOTIFICATION") {
    const { notification } = event.data
    scheduleNotification(notification)
  }

  if (event.data?.type === "CANCEL_NOTIFICATION") {
    const { notificationId } = event.data
    cancelNotification(notificationId)
  }
})

// Background sync functions
async function syncUserData() {
  try {
    console.log("[SW] Syncing user data...")

    // Get data from storage
    const data = await getStoredData("lifeOS-complete-data")

    if (data && data.needsSync) {
      // In a real app, you would sync with your server here
      console.log("[SW] User data sync completed")

      // Mark as synced
      data.needsSync = false
      await storeData("lifeOS-complete-data", data)
    }
  } catch (error) {
    console.error("[SW] User data sync failed:", error)
    throw error
  }
}

async function syncHabits() {
  try {
    console.log("[SW] Syncing habits...")

    const habits = await getStoredData("lifeOS-habits")

    if (habits && habits.length > 0) {
      const today = new Date().toDateString()
      const completedToday = habits.filter((h) => h.completionHistory && h.completionHistory.includes(today))

      console.log(`[SW] ${completedToday.length} habits completed today`)
    }
  } catch (error) {
    console.error("[SW] Habit sync failed:", error)
    throw error
  }
}

async function syncNotifications() {
  try {
    console.log("[SW] Syncing notifications...")

    const notifications = await getStoredData("lifeOS-scheduled-notifications")

    if (notifications && notifications.length > 0) {
      // Process any pending notifications
      const now = Date.now()
      const dueNotifications = notifications.filter((n) => n.scheduledTime <= now)

      for (const notification of dueNotifications) {
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon || "/icon-192x192.png",
          tag: notification.tag,
          data: notification.data,
        })
      }

      // Remove processed notifications
      const remainingNotifications = notifications.filter((n) => n.scheduledTime > now)
      await storeData("lifeOS-scheduled-notifications", remainingNotifications)
    }
  } catch (error) {
    console.error("[SW] Notification sync failed:", error)
    throw error
  }
}

// Helper functions for storage
async function getStoredData(key) {
  try {
    // In a real implementation, you might use IndexedDB
    // For now, we'll simulate with a simple approach
    return null
  } catch (error) {
    console.error("[SW] Error getting stored data:", error)
    return null
  }
}

async function storeData(key, data) {
  try {
    // In a real implementation, you might use IndexedDB
    // For now, we'll simulate with a simple approach
    console.log(`[SW] Storing data for key: ${key}`)
  } catch (error) {
    console.error("[SW] Error storing data:", error)
  }
}

// Notification scheduling functions
function scheduleNotification(notification) {
  console.log("[SW] Scheduling notification:", notification.title)

  const delay = notification.scheduledTime - Date.now()

  if (delay <= 0) {
    // Show immediately
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon || "/icon-192x192.png",
      tag: notification.tag,
      data: notification.data,
    })
  } else {
    // Schedule for later (this is a simplified approach)
    setTimeout(() => {
      self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || "/icon-192x192.png",
        tag: notification.tag,
        data: notification.data,
      })
    }, delay)
  }
}

function cancelNotification(notificationId) {
  console.log("[SW] Cancelling notification:", notificationId)
  // In a real implementation, you would track and cancel scheduled notifications
}

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  console.log("[SW] Periodic sync:", event.tag)

  if (event.tag === "habit-reminder") {
    event.waitUntil(checkHabitReminders())
  }
})

async function checkHabitReminders() {
  try {
    const habits = await getStoredData("lifeOS-habits")
    const today = new Date().toDateString()

    if (habits) {
      const incompleteHabits = habits.filter(
        (habit) => !habit.completionHistory || !habit.completionHistory.includes(today),
      )

      if (incompleteHabits.length > 0) {
        await self.registration.showNotification("Habit Reminder", {
          body: `You have ${incompleteHabits.length} habits to complete today!`,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "habit-reminder",
          data: { url: "/habits" },
        })
      }
    }
  } catch (error) {
    console.error("[SW] Habit reminder check failed:", error)
  }
}
