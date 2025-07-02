import { PWAManager } from "./pwa-manager"

/* ------------------------------------------------------------------ */
/*                   Public constants (unchanged)                     */
/* ------------------------------------------------------------------ */
export const DATA_VERSION = "1.2.0"
export const STORAGE_KEYS = {
  COMPLETE_DATA: "lifeOS-complete-data",
  HABITS: "lifeOS-habits",
  JOURNAL: "lifeOS-journal",
  TODOS: "lifeOS-todos",
  STATS: "lifeOS-stats",
  CHECKINS: "lifeOS-checkins",
  MISSIONS: "lifeOS-missions",
  PROFILE: "lifeOS-profile",
  SETTINGS: "lifeOS-settings",
  BACKUP: "lifeOS-backup",
  VERSION: "lifeOS-version",
}

/* ------------------------------------------------------------------ */
/*                        Helper utilities                            */
/* ------------------------------------------------------------------ */
function isProbablyBase64(str: string): boolean {
  if (!str || str.length % 4 !== 0) return false
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str)
}

/* ------------------------------------------------------------------ */
/*                   DataManager implementation                       */
/* ------------------------------------------------------------------ */
export interface CompleteUserData {
  version: string
  profile: any
  stats: any
  habits: any[]
  journalEntries: any[]
  checkIns: any[]
  todos: any[]
  missions: any[]
  settings: {
    preferredCheckInTime: string
    notificationsEnabled: boolean
    theme: string
  }
  lastBackup: string
  needsSync?: boolean
}

export class DataManager {
  private static instance: DataManager
  private pwaManager: PWAManager
  private isInitialized = false

  private constructor() {
    this.pwaManager = PWAManager.getInstance()
  }

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  /* ------------------------------------------------------------------ */
  /*                      Static convenience wrappers                   */
  /* ------------------------------------------------------------------ */
  static async initialize(): Promise<void> {
    return DataManager.getInstance().initialize()
  }

  static async loadCompleteData(): Promise<CompleteUserData> {
    return DataManager.getInstance().loadCompleteData()
  }

  static async saveCompleteData(data: CompleteUserData): Promise<void> {
    return DataManager.getInstance().saveCompleteData(data)
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize PWA Manager first
      await this.pwaManager.initialize()

      // Run data migration if needed
      await this.migrateData()

      // Setup automatic backup
      this.setupAutomaticBackup()

      // Setup cleanup routine
      this.setupCleanup()

      this.isInitialized = true
      console.log("✅ DataManager initialized successfully")
    } catch (error) {
      console.error("❌ DataManager initialization failed:", error)
      throw error
    }
  }

  private async migrateData(): Promise<void> {
    try {
      const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION)

      if (currentVersion !== DATA_VERSION) {
        console.log(`🔄 Migrating data from ${currentVersion || "unknown"} to ${DATA_VERSION}`)

        // Perform any necessary data migrations here
        await this.performMigration(currentVersion, DATA_VERSION)

        localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION)
        console.log("✅ Data migration completed")
      }
    } catch (error) {
      console.error("❌ Data migration failed:", error)
      throw error
    }
  }

  private async performMigration(fromVersion: string | null, toVersion: string): Promise<void> {
    // Add specific migration logic here as needed
    console.log(`Migrating from ${fromVersion} to ${toVersion}`)
  }

  private setupAutomaticBackup(): void {
    // Run backup every 24 hours
    setInterval(
      () => {
        this.createBackup().catch((error) => {
          console.error("Automatic backup failed:", error)
        })
      },
      24 * 60 * 60 * 1000,
    )
  }

  private setupCleanup(): void {
    // Run cleanup every week
    setInterval(
      () => {
        this.cleanupOldData().catch((error) => {
          console.error("Cleanup failed:", error)
        })
      },
      7 * 24 * 60 * 60 * 1000,
    )
  }

  async loadCompleteData(): Promise<CompleteUserData> {
    try {
      const dataStr = localStorage.getItem(STORAGE_KEYS.COMPLETE_DATA)

      if (!dataStr) {
        return this.getDefaultData()
      }

      const parsedData = this.parsePossiblyEncrypted(dataStr)

      if (!parsedData) {
        console.warn("Failed to parse stored data, using defaults")
        return this.getDefaultData()
      }

      // Ensure data has current version
      if (parsedData.version !== DATA_VERSION) {
        parsedData.version = DATA_VERSION
      }

      return parsedData
    } catch (error) {
      console.error("Failed to load complete data:", error)
      return this.getDefaultData()
    }
  }

  private parsePossiblyEncrypted(dataStr: string): CompleteUserData | null {
    try {
      // First try parsing as regular JSON
      return JSON.parse(dataStr)
    } catch {
      try {
        // If that fails, try decoding as base64 first
        if (isProbablyBase64(dataStr)) {
          const decoded = atob(dataStr)
          return JSON.parse(decoded)
        }
      } catch {
        // If base64 decoding fails, return null
      }
      return null
    }
  }

  async saveCompleteData(data: CompleteUserData): Promise<void> {
    try {
      data.version = DATA_VERSION
      data.lastBackup = new Date().toISOString()

      const dataStr = JSON.stringify(data)
      localStorage.setItem(STORAGE_KEYS.COMPLETE_DATA, dataStr)

      console.log("✅ Complete data saved successfully")
    } catch (error) {
      console.error("❌ Failed to save complete data:", error)
      throw error
    }
  }

  private getDefaultData(): CompleteUserData {
    return {
      version: DATA_VERSION,
      profile: {
        age: 25,
        height: "5'8\"",
        weight: "150 lbs",
      },
      stats: { MIND: 0, BODY: 0, SPIRIT: 0, WORK: 0, PLAY: 0 },
      habits: [],
      journalEntries: [],
      checkIns: [],
      todos: [],
      missions: [],
      settings: {
        preferredCheckInTime: "20:00",
        notificationsEnabled: true,
        theme: "dark",
      },
      lastBackup: new Date().toISOString(),
    }
  }

  async createBackup(): Promise<string> {
    try {
      const data = await this.loadCompleteData()
      const backupData = {
        ...data,
        backupCreated: new Date().toISOString(),
        backupVersion: DATA_VERSION,
      }

      const backupStr = JSON.stringify(backupData, null, 2)
      const backupKey = `${STORAGE_KEYS.BACKUP}-${Date.now()}`

      localStorage.setItem(backupKey, backupStr)

      console.log("✅ Backup created:", backupKey)
      return backupKey
    } catch (error) {
      console.error("❌ Backup creation failed:", error)
      throw error
    }
  }

  async restoreFromBackup(backupKey: string): Promise<void> {
    try {
      const backupStr = localStorage.getItem(backupKey)

      if (!backupStr) {
        throw new Error("Backup not found")
      }

      const backupData = JSON.parse(backupStr)

      // Remove backup-specific fields
      delete backupData.backupCreated
      delete backupData.backupVersion

      await this.saveCompleteData(backupData)

      console.log("✅ Data restored from backup:", backupKey)
    } catch (error) {
      console.error("❌ Backup restoration failed:", error)
      throw error
    }
  }

  getAvailableBackups(): string[] {
    const keys = Object.keys(localStorage)
    return keys
      .filter((key) => key.startsWith(STORAGE_KEYS.BACKUP))
      .sort((a, b) => {
        const timeA = Number.parseInt(a.split("-").pop() || "0")
        const timeB = Number.parseInt(b.split("-").pop() || "0")
        return timeB - timeA // Most recent first
      })
  }

  async cleanupOldData(): Promise<void> {
    try {
      const backups = this.getAvailableBackups()

      // Keep only the 5 most recent backups
      const backupsToDelete = backups.slice(5)

      for (const backup of backupsToDelete) {
        localStorage.removeItem(backup)
      }

      if (backupsToDelete.length > 0) {
        console.log(`🧹 Cleaned up ${backupsToDelete.length} old backups`)
      }
    } catch (error) {
      console.error("❌ Cleanup failed:", error)
    }
  }

  async exportData(): Promise<string> {
    try {
      const data = await this.loadCompleteData()
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error("❌ Data export failed:", error)
      throw error
    }
  }

  async importData(dataStr: string): Promise<void> {
    try {
      const data = JSON.parse(dataStr)

      // Validate data structure
      if (!data.version || !data.stats || !data.profile) {
        throw new Error("Invalid data format")
      }

      await this.saveCompleteData(data)

      console.log("✅ Data imported successfully")
    } catch (error) {
      console.error("❌ Data import failed:", error)
      throw error
    }
  }
}

// Export singleton instance and utility functions
export const dataManager = DataManager.getInstance()

export function generateDailyMissions() {
  const missions = [
    {
      id: `mission_${Date.now()}_1`,
      title: "Morning Reflection",
      description: "Take 5 minutes to reflect on your goals for today",
      stat: "MIND",
      xpReward: 25,
      completed: false,
      type: "daily",
    },
    {
      id: `mission_${Date.now()}_2`,
      title: "Physical Activity",
      description: "Do 10 minutes of physical exercise",
      stat: "BODY",
      xpReward: 30,
      completed: false,
      type: "daily",
    },
    {
      id: `mission_${Date.now()}_3`,
      title: "Gratitude Practice",
      description: "Write down 3 things you're grateful for",
      stat: "SPIRIT",
      xpReward: 20,
      completed: false,
      type: "daily",
    },
  ]

  return missions
}
