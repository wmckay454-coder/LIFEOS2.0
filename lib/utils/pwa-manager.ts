export class PWAManager {
  private static instance: PWAManager
  private registration: ServiceWorkerRegistration | null = null
  private isInitialized = false

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log("🔧 Initializing PWA Manager...")

      // Check if service workers are supported
      if (!("serviceWorker" in navigator)) {
        console.warn("⚠️ Service Workers not supported")
        return
      }

      // Unregister any existing service workers first
      await this.unregisterExistingWorkers()

      // Register new service worker
      await this.registerServiceWorker()

      // Initialize other PWA features
      await this.initializeNotifications()
      await this.initializeInstallPrompt()

      this.isInitialized = true
      console.log("✅ PWA Manager initialized successfully")
    } catch (error) {
      console.error("❌ PWA Manager initialization failed:", error)
      throw error
    }
  }

  private async unregisterExistingWorkers(): Promise<void> {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        console.log("🗑️ Unregistering existing service worker")
        await registration.unregister()
      }
    } catch (error) {
      console.warn("⚠️ Failed to unregister existing workers:", error)
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      console.log("📝 Registering service worker...")

      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })

      console.log("✅ Service Worker registered successfully")

      // Handle updates
      this.registration.addEventListener("updatefound", () => {
        console.log("🔄 Service Worker update found")
        const newWorker = this.registration?.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("🆕 New Service Worker available")
              // Optionally notify user about update
            }
          })
        }
      })

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      console.log("🚀 Service Worker is ready")
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error)
      throw error
    }
  }

  private async initializeNotifications(): Promise<void> {
    try {
      if (!("Notification" in window)) {
        console.warn("⚠️ Notifications not supported")
        return
      }

      if (Notification.permission === "default") {
        console.log("🔔 Requesting notification permission...")
        const permission = await Notification.requestPermission()
        console.log("🔔 Notification permission:", permission)
      }
    } catch (error) {
      console.warn("⚠️ Failed to initialize notifications:", error)
    }
  }

  private async initializeInstallPrompt(): Promise<void> {
    try {
      let deferredPrompt: any = null

      window.addEventListener("beforeinstallprompt", (e) => {
        console.log("📱 Install prompt available")
        e.preventDefault()
        deferredPrompt = e

        // Dispatch custom event for UI components
        window.dispatchEvent(new CustomEvent("pwa-install-available", { detail: deferredPrompt }))
      })

      window.addEventListener("appinstalled", () => {
        console.log("✅ PWA installed successfully")
        deferredPrompt = null
        window.dispatchEvent(new CustomEvent("pwa-installed"))
      })
    } catch (error) {
      console.warn("⚠️ Failed to initialize install prompt:", error)
    }
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.registration) {
      throw new Error("Service Worker not registered")
    }

    if (Notification.permission !== "granted") {
      throw new Error("Notification permission not granted")
    }

    const defaultOptions: NotificationOptions = {
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "life-os-notification",
      requireInteraction: false,
      ...options,
    }

    await this.registration.showNotification(title, defaultOptions)
  }

  async scheduleNotification(title: string, options: NotificationOptions, delay: number): Promise<void> {
    setTimeout(async () => {
      try {
        await this.showNotification(title, options)
      } catch (error) {
        console.error("❌ Failed to show scheduled notification:", error)
      }
    }, delay)
  }

  getInstallationStatus(): {
    isInstalled: boolean
    isStandalone: boolean
    canInstall: boolean
  } {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

    return {
      isInstalled: isStandalone,
      isStandalone,
      canInstall: !isStandalone && "serviceWorker" in navigator,
    }
  }

  getServiceWorkerStatus(): {
    isRegistered: boolean
    isActive: boolean
    version: string | null
  } {
    return {
      isRegistered: !!this.registration,
      isActive: !!this.registration?.active,
      version: this.registration?.active?.scriptURL.includes("v1.7.0") ? "1.7.0" : null,
    }
  }

  async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update()
    }
  }

  async clearCache(): Promise<void> {
    if ("caches" in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
      console.log("🗑️ All caches cleared")
    }
  }
}

export const pwaManager = PWAManager.getInstance()
export default PWAManager
