export interface DataEntry {
  id: string
  type: "journal" | "todo" | "habit" | "checkin" | "goal" | "note"
  title: string
  content: any
  timestamp: number
  tags?: string[]
  metadata?: Record<string, any>
  synced?: boolean
  syncedAt?: number
}

export interface SyncStatus {
  lastSync: number
  pendingItems: number
  isOnline: boolean
  isSyncing: boolean
}

export class DataManager {
  private static instance: DataManager
  private dbName = "LifeOSData"
  private dbVersion = 1
  private db: IDBDatabase | null = null

  private constructor() {
    this.initDB()
  }

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains("entries")) {
          const entryStore = db.createObjectStore("entries", { keyPath: "id" })
          entryStore.createIndex("type", "type", { unique: false })
          entryStore.createIndex("timestamp", "timestamp", { unique: false })
          entryStore.createIndex("synced", "synced", { unique: false })
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" })
        }

        if (!db.objectStoreNames.contains("cache")) {
          const cacheStore = db.createObjectStore("cache", { keyPath: "key" })
          cacheStore.createIndex("timestamp", "timestamp", { unique: false })
        }
      }
    })
  }

  async saveEntry(entry: Omit<DataEntry, "id" | "timestamp">): Promise<string> {
    if (!this.db) await this.initDB()

    const fullEntry: DataEntry = {
      ...entry,
      id: `${entry.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["entries"], "readwrite")
      const store = transaction.objectStore("entries")
      const request = store.add(fullEntry)

      request.onsuccess = () => resolve(fullEntry.id)
      request.onerror = () => reject(request.error)
    })
  }

  async getEntry(id: string): Promise<DataEntry | null> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["entries"], "readonly")
      const store = transaction.objectStore("entries")
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getEntriesByType(type: DataEntry["type"]): Promise<DataEntry[]> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["entries"], "readonly")
      const store = transaction.objectStore("entries")
      const index = store.index("type")
      const request = index.getAll(type)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllEntries(): Promise<DataEntry[]> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["entries"], "readonly")
      const store = transaction.objectStore("entries")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateEntry(id: string, updates: Partial<DataEntry>): Promise<void> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["entries"], "readwrite")
      const store = transaction.objectStore("entries")

      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const entry = getRequest.result
        if (entry) {
          const updatedEntry = { ...entry, ...updates }
          const putRequest = store.put(updatedEntry)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          reject(new Error("Entry not found"))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async deleteEntry(id: string): Promise<void> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["entries"], "readwrite")
      const store = transaction.objectStore("entries")
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedEntries(): Promise<DataEntry[]> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["entries"], "readonly")
      const store = transaction.objectStore("entries")
      const index = store.index("synced")
      const request = index.getAll(false)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async markAsSynced(id: string): Promise<void> {
    await this.updateEntry(id, { synced: true, syncedAt: Date.now() })
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const unsyncedEntries = await this.getUnsyncedEntries()
    const lastSyncSetting = await this.getSetting("lastSync")

    return {
      lastSync: lastSyncSetting ? Number.parseInt(lastSyncSetting) : 0,
      pendingItems: unsyncedEntries.length,
      isOnline: navigator.onLine,
      isSyncing: false, // This would be managed by sync manager
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put({ key, value, timestamp: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async markBackupReminderShown(): Promise<void> {
  await this.setSetting("backupReminderShown", "true")
}


  async getSetting(key: string): Promise<string | null> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result?.value || null)
      request.onerror = () => reject(request.error)
    })
  }

  async cacheData(key: string, data: any, ttl = 3600000): Promise<void> {
    if (!this.db) await this.initDB()

    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["cache"], "readwrite")
      const store = transaction.objectStore("cache")
      const request = store.put(cacheEntry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["cache"], "readonly")
      const store = transaction.objectStore("cache")
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        if (result && result.expires > Date.now()) {
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["cache"], "readwrite")
      const store = transaction.objectStore("cache")
      const index = store.index("timestamp")
      const request = index.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const entry = cursor.value
          if (entry.expires <= Date.now()) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async exportData(): Promise<string> {
    const entries = await this.getAllEntries()
    return JSON.stringify(
      {
        version: this.dbVersion,
        timestamp: Date.now(),
        entries,
      },
      null,
      2,
    )
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData)

      if (data.entries && Array.isArray(data.entries)) {
        for (const entry of data.entries) {
          // Generate new ID to avoid conflicts
          const newEntry = {
            ...entry,
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            synced: false,
          }

          await new Promise<void>((resolve, reject) => {
            const transaction = this.db!.transaction(["entries"], "readwrite")
            const store = transaction.objectStore("entries")
            const request = store.add(newEntry)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
      }
    } catch (error) {
      throw new Error("Invalid data format")
    }
  }

downloadBackup(): void {
  this.exportData().then((data) => {
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `LifeOS-Backup-${Date.now()}.json`
    a.click()

    URL.revokeObjectURL(url)
  })
}

  async clearAllData(): Promise<void> {
    if (!this.db) await this.initDB()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["entries", "settings", "cache"], "readwrite")

      const clearEntries = transaction.objectStore("entries").clear()
      const clearSettings = transaction.objectStore("settings").clear()
      const clearCache = transaction.objectStore("cache").clear()

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}


export const dataManager = DataManager.getInstance()
