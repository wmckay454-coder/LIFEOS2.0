export interface DataEntry {
  id: string
  type: "journal" | "todo" | "habit" | "checkin" | "goal" | "note"
  title: string
  content: any/**
 * dataManager.ts
 *
 * A robust, type-safe IndexedDB wrapper for LifeOS, with enhanced error handling,
 * batch operations, and utility transaction helpers.
 */

// -- Constants ---------------------------------------------------------------
export const STORAGE_KEYS = {
  BACKUP_REMINDER: "backupReminderShown",
  LAST_SYNC: "lastSync",
} as const;

export const DATA_VERSION = "1.0.0";

// -- Types ------------------------------------------------------------------
export interface DataEntry {
  id: string;
  type: "journal" | "todo" | "habit" | "checkin" | "goal" | "note";
  title: string;
  content: unknown;
  timestamp: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  synced?: boolean;
  syncedAt?: number;
}

export interface SyncStatus {
  lastSync: number;
  pendingItems: number;
  isOnline: boolean;
  isSyncing: boolean;
}

// -- DataManager ------------------------------------------------------------
export class DataManager {
  private static instance: DataManager;
  private databaseName = "LifeOSData";
  private databaseVersion = 1;
  private db: IDBDatabase | null = null;
  private initialized = false;

  private constructor() {}

  /** Singleton accessor */
  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  /**
   * Initialize IndexedDB and object stores once.
   */
  private initDB(): Promise<void> {
    if (this.initialized && this.db) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.databaseName, this.databaseVersion);
      req.onerror = () => reject(new Error("IndexedDB open failed: " + req.error));
      req.onsuccess = () => {
        this.db = req.result;
        this.initialized = true;
        resolve();
      };
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("entries")) {
          const s = db.createObjectStore("entries", { keyPath: "id" });
          s.createIndex("type", "type", { unique: false });
          s.createIndex("timestamp", "timestamp", { unique: false });
          s.createIndex("synced", "synced", { unique: false });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("cache")) {
          const c = db.createObjectStore("cache", { keyPath: "key" });
          c.createIndex("expires", "expires", { unique: false });
        }
      };
    });
  }

  /**
   * Generic transaction runner to DRY up boilerplate.
   */
  private async runTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    await this.initDB();
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = callback(store);
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  }

  // -- Entry CRUD -----------------------------------------------------------

  /** Save a new entry and return its generated ID. */
  public async saveEntry(
    entry: Omit<DataEntry, "id" | "timestamp">
  ): Promise<string> {
    const full: DataEntry = {
      ...entry,
      id: `${entry.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      synced: false,
    };
    await this.runTransaction<void>("entries", "readwrite", (s) => s.add(full));
    return full.id;
  }

  /** Retrieve an entry by its ID. */
  public async getEntry(id: string): Promise<DataEntry | null> {
    return this.runTransaction<DataEntry | null>("entries", "readonly", (s) =>
      s.get(id)
    );
  }

  /** Get all entries of a given type. */
  public async getEntriesByType(
    type: DataEntry["type"]
  ): Promise<DataEntry[]> {
    await this.initDB();
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("entries", "readonly");
      const idx = tx.objectStore("entries").index("type");
      const req = idx.getAll(type);
      req.onsuccess = () => resolve(req.result as DataEntry[]);
      req.onerror = () => reject(req.error);
    });
  }

  /** Get every entry in the store. */
  public async getAllEntries(): Promise<DataEntry[]> {
    return this.runTransaction<DataEntry[]>("entries", "readonly", (s) =>
      s.getAll()
    );
  }

  /** Update fields of an existing entry. */
  public async updateEntry(
    id: string,
    updates: Partial<DataEntry>
  ): Promise<void> {
    await this.initDB();
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("entries", "readwrite");
      const store = tx.objectStore("entries");
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (!existing) return reject(new Error("Entry not found"));
        const merged = { ...existing, ...updates };
        const putReq = store.put(merged);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /** Delete an entry by ID. */
  public async deleteEntry(id: string): Promise<void> {
    await this.runTransaction<void>("entries", "readwrite", (s) =>
      s.delete(id)
    );
  }

  /** Get entries not yet synced to server. */
  public async getUnsyncedEntries(): Promise<DataEntry[]> {
    await this.initDB();
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("entries", "readonly");
      const idx = tx.objectStore("entries").index("synced");
      const req = idx.getAll(false);
      req.onsuccess = () => resolve(req.result as DataEntry[]);
      req.onerror = () => reject(req.error);
    });
  }

  /** Mark an entry as synced. */
  public async markAsSynced(id: string): Promise<void> {
    await this.updateEntry(id, { synced: true, syncedAt: Date.now() });
  }

  // -- Settings -------------------------------------------------------------

  /** Store a key/value setting. */
  public async setSetting(key: string, value: string): Promise<void> {
    await this.runTransaction<void>("settings", "readwrite", (s) =>
      s.put({ key, value, timestamp: Date.now() })
    );
  }

  /** Retrieve a previously stored setting. */
  public async getSetting(key: string): Promise<string | null> {
    return this.runTransaction<{ key: string; value: string } | null>(
      "settings",
      "readonly",
      (s) => s.get(key)
    ).then((res) => (res ? res.value : null));
  }

  /** Special helper: mark that backup reminder was shown. */
  public async markBackupReminderShown(): Promise<void> {
    await this.setSetting(STORAGE_KEYS.BACKUP_REMINDER, "true");
  }

  // -- Cache ----------------------------------------------------------------

  /** Cache arbitrary data with TTL. */
  public async cacheData(
    key: string,
    data: unknown,
    ttl = 3600000
  ): Promise<void> {
    const expires = Date.now() + ttl;
    await this.runTransaction<void>("cache", "readwrite", (s) =>
      s.put({ key, data, expires })
    );
  }

  /** Fetch cached data if still valid. */
  public async getCachedData(key: string): Promise<unknown | null> {
    const rec = await this.runTransaction<{ data: unknown; expires: number } | null>(
      "cache",
      "readonly",
      (s) => s.get(key)
    );
    return rec && rec.expires > Date.now() ? rec.data : null;
  }

  /** Clear expired cache entries. */
  public async clearExpiredCache(): Promise<void> {
    await this.initDB();
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("cache", "readwrite");
      const idx = tx.objectStore("cache").index("expires");
      const cursorReq = idx.openCursor();
      cursorReq.onsuccess = (e) => {
        const cur = (e.target as IDBRequest).result;
        if (cur) {
          if (cur.value.expires <= Date.now()) cur.delete();
          cur.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }

  // -- Backup / Import/Export ------------------------------------------------

  /** Export all data as JSON string. */
  public async exportData(): Promise<string> {
    const entries = await this.getAllEntries();
    return JSON.stringify({ version: DATA_VERSION, timestamp: Date.now(), entries }, null, 2);
  }

  /** Import data in one batch transaction. */
  public async importData(json: string): Promise<void> {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed.entries)) throw new Error("Invalid import format");
    await this.initDB();
    if (!this.db) throw new Error("Database not initialized");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction("entries", "readwrite");
      const store = tx.objectStore("entries");
      for (const entry of parsed.entries) {
        const newId = `import-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        store.add({ ...entry, id: newId, synced: false });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Trigger browser download of backup JSON. */
  public downloadBackup(): void {
    this.exportData().then((data) => {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LifeOS-Backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // -- Sync Status ----------------------------------------------------------

  /** Compute basic sync status info. */
  public async getSyncStatus(): Promise<SyncStatus> {
    const pending = await this.getUnsyncedEntries();
    const last = await this.getSetting(STORAGE_KEYS.LAST_SYNC);
    return {
      lastSync: last ? parseInt(last) : 0,
      pendingItems: pending.length,
      isOnline: navigator.onLine,
      isSyncing: false,
    };
  }

  /** Clear all data in every store. */
  public async clearAllData(): Promise<void> {
    await Promise.all([
      this.runTransaction<void>("entries", "readwrite", (s) => s.clear()),
      this.runTransaction<void>("settings", "readwrite", (s) => s.clear()),
      this.runTransaction<void>("cache", "readwrite", (s) => s.clear()),
    ]);
  }
}

// Singleton export
export const dataManager = DataManager.getInstance();

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
export const STORAGE_KEYS = {
  BACKUP_REMINDER: "backupReminderShown",
  LAST_SYNC: "lastSync",
}

export const DATA_VERSION = "1.0.0"
