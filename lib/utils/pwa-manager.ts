class PWAManager {
  private static instance: PWAManager
  private deferredPrompt: any = null
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  private async initialize() {
    try {
      // Register service worker
      if ("serviceWorker" in navigator) {
        this.registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })
        console.log("Service Worker registered successfully:", this.registration)

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener("message", (event) => {
          console.log("Message from Service Worker:", event.data)

          if (event.data.type === "NOTIFICATION_SHOWN") {
            console.log("Notification shown:", event.data.notification)
          }

          if (event.data.type === "NOTIFICATION_ERROR") {
            console.error("Notification error:", event.data.error)
          }

          if (event.data.type === "NOTIFICATION_CLICKED") {
            console.log("Notification clicked:", event.data.notification)
            // Handle notification click in your app
          }
        })
      }

      // Listen for install prompt
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault()
        this.deferredPrompt = e
        console.log("Install prompt available")

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent("pwa-install-available", { detail: e }))
      })

      // Listen for app installed
      window.addEventListener("appinstalled", () => {
        console.log("PWA was installed")
        this.deferredPrompt = null

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent("pwa-installed"))
      })
    } catch (error) {
      console.error("PWA Manager initialization failed:", error)
    }
  }

  // Test notification using postMessage to service worker
  async testNotification(title?: string, body?: string): Promise<boolean> {
    try {
      if (!this.registration) {
        throw new Error("Service Worker not registered")
      }

      // Check notification permission
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          throw new Error("Notification permission denied")
        }
      }

      // Send test notification message to service worker
      return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel()

        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log("Test notification sent successfully")
            resolve(true)
          } else {
            console.error("Test notification failed:", event.data.error)
            reject(new Error(event.data.error))
          }
        }

        if (this.registration?.active) {
          this.registration.active.postMessage(
            {
              type: "TEST_NOTIFICATION",
              title: title || "Test Notification",
              body: body || "This is a test notification from Life OS!",
            },
            [messageChannel.port2],
          )
        } else {
          reject(new Error("Service Worker not active"))
        }
      })
    } catch (error) {
      console.error("Failed to send test notification:", error)
      return false
    }
  }

  // Test notification using API endpoint
  async testNotificationViaAPI(notificationData: any): Promise<boolean> {
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      })

      const result = await response.json()

      if (result.success) {
        console.log("Notification API called successfully:", result)

        // Simulate push notification by calling service worker directly
        if (this.registration?.active) {
          // Create a simulated push event
          const pushData = {
            title: notificationData.title,
            body: notificationData.body,
            icon: notificationData.icon,
            data: notificationData.data,
          }

          // Send message to service worker to simulate push
          this.registration.active.postMessage({
            type: "TEST_NOTIFICATION",
            ...pushData,
          })
        }

        return true
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Failed to test notification via API:", error)
      return false
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      console.log("Notification permission:", permission)
      return permission
    }
    return "denied"
  }

  // Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt()
        const { outcome } = await this.deferredPrompt.userChoice
        console.log("Install prompt outcome:", outcome)

        if (outcome === "accepted") {
          this.deferredPrompt = null
          return true
        }
      } catch (error) {
        console.error("Error showing install prompt:", error)
      }
    }
    return false
  }

  // Get installation status
  getInstallationStatus() {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

    return {
      isInstalled: isStandalone,
      isStandalone: isStandalone,
      canInstall: !!this.deferredPrompt,
    }
  }

  // Get service worker status
  getServiceWorkerStatus() {
    if (!this.registration) {
      return {
        isRegistered: false,
        isActive: false,
        version: null,
      }
    }

    return {
      isRegistered: true,
      isActive: !!this.registration.active,
      version: "1.8.0",
    }
  }

  // Clear cache
  async clearCache(): Promise<void> {
    if ("caches" in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      console.log("All caches cleared")
    }
  }

  // Check for updates
  async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update()
      console.log("Service Worker update check completed")
    }
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance()

// Export class for type checking
export default PWAManager
