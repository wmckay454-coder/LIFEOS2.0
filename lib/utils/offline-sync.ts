export interface OfflineTask {
  id: string
  type: "journal" | "todo" | "habit" | "checkin" | "custom"
  data: any
  timestamp: number
  synced: boolean
  syncedAt?: number
  retryCount?: number
  priority?: number
}

export interface SyncQueueItem {
  id: string
  type: string
  data: any
  timestamp: number
  priority: number
  retryCount: number
  lastAttempt?: number
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager
  private registration: ServiceWorkerRegistration | null = null
  private syncInProgress = false

  private constructor() {
    this.initialize()
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager()
    }
    return OfflineSyncManager.instance
  }

  private async initialize() {
    if ("serviceWorker" in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready

        // Listen for online/offline events
        window.addEventListener("online", () => {
          console.log("Back online - triggering sync")
          this.triggerSync()
        })

        window.addEventListener("offline", () => {
          console.log("Gone offline - enabling offline mode")
        })

        // Register for background sync if supported
        if ("sync" in window.ServiceWorkerRegistration.prototype) {
          console.log("Background sync supported")
        }

        console.log("OfflineSyncManager initialized")
      } catch (error) {
        console.error("Failed to initialize OfflineSyncManager:", error)
      }
    }
  }

  async addOfflineTask(type: OfflineTask["type"], data: any, priority = 1): Promise<string> {
    if (!this.registration?.active) {
      throw new Error("Service Worker not available")
    }

    const task: OfflineTask = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
      priority,
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.id)
        } else {
          reject(new Error("Failed to add offline task"))
        }
      }

      this.registration!.active!.postMessage(
        {
          type: "ADD_OFFLINE_TASK",
          data: task,
        },
        [messageChannel.port2],
      )
    })
  }

  async triggerSync(): Promise<void> {
    if (this.syncInProgress) {
      console.log("Sync already in progress")
      return
    }

    this.syncInProgress = true

    try {
      if (!navigator.onLine) {
        console.log("Device is offline, cannot sync")
        return
      }

      if (this.registration?.active) {
        // Trigger sync via message
        const messageChannel = new MessageChannel()

        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log("Sync completed successfully")
          } else {
            console.error("Sync failed")
          }
          this.syncInProgress = false
        }

        this.registration.active.postMessage({ type: "TRIGGER_SYNC" }, [messageChannel.port2])

        // Also trigger background sync if supported
        if ("sync" in window.ServiceWorkerRegistration.prototype) {
          await this.registration.sync.register("sync-tasks")
        }
      }
    } catch (error) {
      console.error("Failed to trigger sync:", error)
      this.syncInProgress = false
    }
  }

  // Convenience methods for common offline tasks
  async addOfflineJournalEntry(entry: any): Promise<string> {
    return this.addOfflineTask("journal", entry, 2)
  }

  async addOfflineTodo(todo: any): Promise<string> {
    return this.addOfflineTask("todo", todo, 1)
  }

  async addOfflineHabitLog(habit: any): Promise<string> {
    return this.addOfflineTask("habit", habit, 1)
  }

  async addOfflineCheckin(checkin: any): Promise<string> {
    return this.addOfflineTask("checkin", checkin, 3)
  }

  // Check if device is online
  isOnline(): boolean {
    return navigator.onLine
  }

  // Get sync status
  isSyncInProgress(): boolean {
    return this.syncInProgress
  }
}

export const offlineSyncManager = OfflineSyncManager.getInstance()
