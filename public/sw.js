// Life OS Service Worker
// Version: 2.0.0 - Advanced Scheduled Notifications & Background Sync

const CACHE_NAME = "life-os-v2.0.0"
const STATIC_CACHE = "life-os-static-v2.0.0"
const DYNAMIC_CACHE = "life-os-dynamic-v2.0.0"

// IndexedDB setup for persistent storage
const DB_NAME = "LifeOSDB"
const DB_VERSION = 1
const STORES = {
  SCHEDULED_NOTIFICATIONS: "scheduledNotifications",
  OFFLINE_TASKS: "offlineTasks",
  CALENDAR_EVENTS: "calendarEvents",
  SYNC_QUEUE: "syncQueue",
}

// Core files to cache
const CORE_ASSETS = ["/", "/manifest.json", "/favicon.ico", "/icon-192x192.png", "/icon-512x512.png"]

// Global variables for scheduling
const scheduledTimeouts = new Map()
let db = null

// Initialize IndexedDB
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      // Scheduled notifications store
      if (!database.objectStoreNames.contains(STORES.SCHEDULED_NOTIFICATIONS)) {
        const notificationStore = database.createObjectStore(STORES.SCHEDULED_NOTIFICATIONS, { keyPath: "id" })
        notificationStore.createIndex("scheduledTime", "scheduledTime", { unique: false })
        notificationStore.createIndex("status", "status", { unique: false })
      }

      // Offline tasks store
      if (!database.objectStoreNames.contains(STORES.OFFLINE_TASKS)) {
        const taskStore = database.createObjectStore(STORES.OFFLINE_TASKS, { keyPath: "id" })
        taskStore.createIndex("timestamp", "timestamp", { unique: false })
        taskStore.createIndex("type", "type", { unique: false })
      }

      // Calendar events store
      if (!database.objectStoreNames.contains(STORES.CALENDAR_EVENTS)) {
        const calendarStore = database.createObjectStore(STORES.CALENDAR_EVENTS, { keyPath: "id" })
        calendarStore.createIndex("startTime", "startTime", { unique: false })
        calendarStore.createIndex("notificationTime", "notificationTime", { unique: false })
      }

      // Sync queue store
      if (!database.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = database.createObjectStore(STORES.SYNC_QUEUE, { keyPath: "id" })
        syncStore.createIndex("timestamp", "timestamp", { unique: false })
        syncStore.createIndex("priority", "priority", { unique: false })
      }
    }
  })
}

// Database operations
async function addToStore(storeName, data) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.add(data)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function updateStore(storeName, data) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.put(data)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getFromStore(storeName, key) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.get(key)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getAllFromStore(storeName) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function deleteFromStore(storeName, key) {
  if (!db) await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Scheduled notification management
async function scheduleNotification(notificationData) {
  const now = Date.now()
  const scheduledTime = new Date(notificationData.scheduledTime).getTime()

  if (scheduledTime <= now) {
    console.log("[SW] Scheduled time is in the past, showing immediately")
    await showScheduledNotification(notificationData)
    return
  }

  // Store in IndexedDB
  const storedNotification = {
    ...notificationData,
    id: notificationData.id || `notification-${Date.now()}`,
    status: "scheduled",
    createdAt: now,
    scheduledTime: scheduledTime,
  }

  try {
    await addToStore(STORES.SCHEDULED_NOTIFICATIONS, storedNotification)
    console.log("[SW] Notification stored in IndexedDB:", storedNotification.id)

    // Set timeout for immediate scheduling (if app is active)
    const delay = scheduledTime - now
    if (delay <= 2147483647) {
      // Max setTimeout value
      const timeoutId = setTimeout(async () => {
        await showScheduledNotification(storedNotification)
        scheduledTimeouts.delete(storedNotification.id)
      }, delay)

      scheduledTimeouts.set(storedNotification.id, timeoutId)
      console.log("[SW] Timeout set for notification:", storedNotification.id, "in", delay, "ms")
    }

    return storedNotification.id
  } catch (error) {
    console.error("[SW] Failed to store scheduled notification:", error)
    throw error
  }
}

async function showScheduledNotification(notificationData) {
  try {
    const options = {
      body: notificationData.body,
      icon: notificationData.icon || "/icon-192x192.png",
      badge: notificationData.badge || "/icon-192x192.png",
      tag: notificationData.tag || notificationData.id,
      data: {
        ...notificationData.data,
        scheduledId: notificationData.id,
        isScheduled: true,
      },
      requireInteraction: notificationData.requireInteraction || false,
      silent: notificationData.silent || false,
      vibrate: [200, 100, 200],
      actions: [
        { action: "view", title: "View", icon: "/icon-192x192.png" },
        { action: "dismiss", title: "Dismiss" },
        { action: "snooze", title: "Snooze 5min" },
      ],
    }

    await self.registration.showNotification(notificationData.title, options)

    // Update status in IndexedDB
    if (notificationData.id) {
      const updatedNotification = {
        ...notificationData,
        status: "shown",
        shownAt: Date.now(),
      }
      await updateStore(STORES.SCHEDULED_NOTIFICATIONS, updatedNotification)
    }

    console.log("[SW] Scheduled notification shown:", notificationData.title)
  } catch (error) {
    console.error("[SW] Failed to show scheduled notification:", error)
  }
}

async function cancelScheduledNotification(notificationId) {
  try {
    // Clear timeout if exists
    if (scheduledTimeouts.has(notificationId)) {
      clearTimeout(scheduledTimeouts.get(notificationId))
      scheduledTimeouts.delete(notificationId)
    }

    // Update status in IndexedDB
    const notification = await getFromStore(STORES.SCHEDULED_NOTIFICATIONS, notificationId)
    if (notification) {
      notification.status = "cancelled"
      notification.cancelledAt = Date.now()
      await updateStore(STORES.SCHEDULED_NOTIFICATIONS, notification)
    }

    console.log("[SW] Notification cancelled:", notificationId)
    return true
  } catch (error) {
    console.error("[SW] Failed to cancel notification:", error)
    return false
  }
}

// Calendar event notifications
async function scheduleCalendarNotifications(events) {
  for (const event of events) {
    const eventStartTime = new Date(event.start.dateTime || event.start.date).getTime()
    const notificationTime = eventStartTime - (event.reminderMinutes || 15) * 60 * 1000

    if (notificationTime > Date.now()) {
      const notificationData = {
        id: `calendar-${event.id}`,
        title: `Upcoming: ${event.summary}`,
        body: `Starting ${event.reminderMinutes || 15} minutes from now`,
        scheduledTime: notificationTime,
        data: {
          type: "calendar",
          eventId: event.id,
          eventStart: eventStartTime,
        },
        tag: `calendar-${event.id}`,
      }

      await scheduleNotification(notificationData)

      // Store calendar event
      const calendarEvent = {
        ...event,
        notificationTime,
        notificationScheduled: true,
      }
      await updateStore(STORES.CALENDAR_EVENTS, calendarEvent)
    }
  }
}

// Background sync for offline tasks
async function addOfflineTask(taskData) {
  const task = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...taskData,
    timestamp: Date.now(),
    synced: false,
  }

  await addToStore(STORES.OFFLINE_TASKS, task)

  // Add to sync queue
  await addToStore(STORES.SYNC_QUEUE, {
    id: `sync-${task.id}`,
    type: "task",
    data: task,
    timestamp: Date.now(),
    priority: taskData.priority || 1,
  })

  console.log("[SW] Offline task stored:", task.id)
  return task.id
}

async function syncOfflineTasks() {
  try {
    const syncQueue = await getAllFromStore(STORES.SYNC_QUEUE)
    const tasksToSync = syncQueue.filter((item) => item.type === "task")

    for (const syncItem of tasksToSync) {
      try {
        // Attempt to sync with server
        const response = await fetch("/api/sync-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(syncItem.data),
        })

        if (response.ok) {
          // Mark as synced
          const task = syncItem.data
          task.synced = true
          task.syncedAt = Date.now()

          await updateStore(STORES.OFFLINE_TASKS, task)
          await deleteFromStore(STORES.SYNC_QUEUE, syncItem.id)

          console.log("[SW] Task synced successfully:", task.id)
        } else {
          console.warn("[SW] Failed to sync task:", syncItem.id, response.status)
        }
      } catch (error) {
        console.error("[SW] Error syncing task:", syncItem.id, error)
      }
    }
  } catch (error) {
    console.error("[SW] Error in syncOfflineTasks:", error)
  }
}

// Restore scheduled notifications on startup
async function restoreScheduledNotifications() {
  try {
    const notifications = await getAllFromStore(STORES.SCHEDULED_NOTIFICATIONS)
    const activeNotifications = notifications.filter((n) => n.status === "scheduled")

    const now = Date.now()

    for (const notification of activeNotifications) {
      const scheduledTime = new Date(notification.scheduledTime).getTime()

      if (scheduledTime <= now) {
        // Show immediately if time has passed
        await showScheduledNotification(notification)
      } else {
        // Reschedule
        const delay = scheduledTime - now
        if (delay <= 2147483647) {
          const timeoutId = setTimeout(async () => {
            await showScheduledNotification(notification)
            scheduledTimeouts.delete(notification.id)
          }, delay)

          scheduledTimeouts.set(notification.id, timeoutId)
        }
      }
    }

    console.log("[SW] Restored", activeNotifications.length, "scheduled notifications")
  } catch (error) {
    console.error("[SW] Failed to restore scheduled notifications:", error)
  }
}

// Service Worker Events

// Install event
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker v2.0.0")

  event.waitUntil(
    Promise.all([initDB(), caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS))]).then(() => {
      console.log("[SW] Installation complete")
      return self.skipWaiting()
    }),
  )
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker v2.0.0")

  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                return caches.delete(cacheName)
              }
            }),
          ),
        ),
      // Restore scheduled notifications
      restoreScheduledNotifications(),
      // Claim clients
      self.clients.claim(),
    ]).then(() => {
      console.log("[SW] Activation complete")
    }),
  )
})

// Fetch event
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET" || url.origin !== location.origin) {
    return
  }

  // Handle offline task creation
  if (url.pathname.startsWith("/api/") && !navigator.onLine) {
    event.respondWith(
      (async () => {
        if (request.method === "POST") {
          const data = await request.json()
          await addOfflineTask({
            url: url.pathname,
            method: request.method,
            data: data,
            headers: Object.fromEntries(request.headers.entries()),
          })

          return new Response(
            JSON.stringify({
              success: true,
              offline: true,
              message: "Task stored for sync when online",
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          )
        }

        return new Response("Offline", { status: 503 })
      })(),
    )
    return
  }

  // Cache strategy
  if (CORE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone()
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone))
            }
            return response
          }),
      ),
    )
  } else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => caches.match(request)),
    )
  }
})

// Push event
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received")

  let notificationData = {
    title: "Life OS",
    body: "You have a new notification",
    icon: "/icon-192x192.png",
  }

  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() }
    } catch (error) {
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  event.waitUntil(showScheduledNotification(notificationData))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action)

  event.notification.close()

  if (event.action === "dismiss") {
    return
  }

  if (event.action === "snooze") {
    // Snooze for 5 minutes
    const snoozeTime = Date.now() + 5 * 60 * 1000
    const snoozeNotification = {
      id: `snooze-${Date.now()}`,
      title: `Snoozed: ${event.notification.title}`,
      body: event.notification.body,
      scheduledTime: snoozeTime,
      data: event.notification.data,
    }

    event.waitUntil(scheduleNotification(snoozeNotification))
    return
  }

  // Default action - open app
  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    }),
  )
})

// Background sync event
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag)

  if (event.tag === "background-sync" || event.tag === "sync-tasks") {
    event.waitUntil(syncOfflineTasks())
  }

  if (event.tag === "sync-calendar") {
    event.waitUntil(
      fetch("/api/calendar/sync")
        .then((response) => response.json())
        .then((data) => {
          if (data.events) {
            return scheduleCalendarNotifications(data.events)
          }
        })
        .catch((error) => console.error("[SW] Calendar sync failed:", error)),
    )
  }
})

// Message event
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  const { type, data } = event.data

  if (type === "SCHEDULE_NOTIFICATION") {
    event.waitUntil(
      scheduleNotification(data)
        .then((id) => {
          event.ports[0].postMessage({ success: true, id })
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message })
        }),
    )
  }

  if (type === "CANCEL_NOTIFICATION") {
    event.waitUntil(
      cancelScheduledNotification(data.id).then((success) => {
        event.ports[0].postMessage({ success })
      }),
    )
  }

  if (type === "GET_SCHEDULED_NOTIFICATIONS") {
    event.waitUntil(
      getAllFromStore(STORES.SCHEDULED_NOTIFICATIONS).then((notifications) => {
        event.ports[0].postMessage({ notifications })
      }),
    )
  }

  if (type === "SYNC_CALENDAR_EVENTS") {
    event.waitUntil(
      scheduleCalendarNotifications(data.events).then(() => {
        event.ports[0].postMessage({ success: true })
      }),
    )
  }

  if (type === "ADD_OFFLINE_TASK") {
    event.waitUntil(
      addOfflineTask(data).then((id) => {
        event.ports[0].postMessage({ success: true, id })
      }),
    )
  }

  if (type === "TRIGGER_SYNC") {
    event.waitUntil(
      syncOfflineTasks().then(() => {
        event.ports[0].postMessage({ success: true })
      }),
    )
  }
})

console.log("[SW] Service Worker v2.0.0 loaded with advanced scheduling and sync")
