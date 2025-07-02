export interface ScheduledNotification {
  id: string
  title: string
  body: string
  scheduledTime: number
  icon?: string
  badge?: string
  tag?: string
  data?: any
}

export class PWAManager {
  private static instance: PWAManager
  private isInitialized = false
  private registration: ServiceWorkerRegistration | null = null
  private scheduledNotifications = new Map<string, number>()

  private constructor() {}

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Register service worker
      await this.registerServiceWorker()

      // Request notification permission
      await this.requestNotificationPermission()

      // Initialize push notifications if supported
      if (this.registration && "pushManager" in this.registration) {
        await this.initializePushNotifications()
      }

      this.isInitialized = true
      console.log("✅ PWA Manager initialized successfully")
    } catch (error) {
      console.error("❌ PWA Manager initialization failed:", error)
      throw error
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported")
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("✅ Service Worker registered:", this.registration.scope)

      // Listen for service worker updates
      this.registration.addEventListener("updatefound", () => {
        console.log("🔄 Service Worker update found")
      })
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error)
      throw error
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported")
      return "denied"
    }

    if (Notification.permission === "granted") {
      return "granted"
    }

    if (Notification.permission === "denied") {
      return "denied"
    }

    const permission = await Notification.requestPermission()
    console.log("📱 Notification permission:", permission)
    return permission
  }

  private async initializePushNotifications(): Promise<void> {
    if (!this.registration || !("pushManager" in this.registration)) {
      return
    }

    try {
      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription()

      if (!existingSubscription) {
        // Create new subscription (in a real app, you'd send this to your server)
        const subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            // This is a dummy VAPID key - replace with your actual key
            "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9LdNnC_AAAHH9Ynzjx0SwHSuSxaXdwR_BHSxVlF5_P8xgkcq9eS",
          ),
        })

        console.log("✅ Push subscription created")
      }
    } catch (error) {
      console.warn("Push notifications setup failed:", error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  async scheduleNotification(notification: ScheduledNotification): Promise<boolean> {
    const permission = await this.requestNotificationPermission()

    if (permission !== "granted") {
      console.warn("❌ Notification permission denied")
      return false
    }

    const now = Date.now()
    const delay = notification.scheduledTime - now

    if (delay <= 0) {
      // Show immediately if time has passed
      this.showNotification(notification)
      return true
    }

    // Schedule the notification
    const timeoutId = window.setTimeout(() => {
      this.showNotification(notification)
      this.scheduledNotifications.delete(notification.id)
    }, delay)

    this.scheduledNotifications.set(notification.id, timeoutId)

    console.log(`📅 Notification scheduled for ${new Date(notification.scheduledTime).toLocaleString()}`)
    return true
  }

  private showNotification(notification: ScheduledNotification): void {
    if (this.registration) {
      // Use service worker to show notification
      this.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || "/icon-192x192.png",
        badge: notification.badge || "/icon-192x192.png",
        tag: notification.tag,
        data: notification.data,
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
            icon: "/icon-192x192.png",
          },
        ],
      })
    } else {
      // Fallback to regular notification
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || "/icon-192x192.png",
        tag: notification.tag,
        data: notification.data,
      })
    }
  }

  cancelScheduledNotification(id: string): boolean {
    const timeoutId = this.scheduledNotifications.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.scheduledNotifications.delete(id)
      console.log(`❌ Cancelled scheduled notification: ${id}`)
      return true
    }
    return false
  }

  getScheduledNotifications(): string[] {
    return Array.from(this.scheduledNotifications.keys())
  }

  isNotificationSupported(): boolean {
    return "Notification" in window
  }

  getNotificationPermission(): NotificationPermission {
    return Notification.permission
  }

  isServiceWorkerSupported(): boolean {
    return "serviceWorker" in navigator
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }
}
