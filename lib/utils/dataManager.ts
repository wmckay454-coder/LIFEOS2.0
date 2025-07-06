import PWAManager from "./pwa-manager"
import { safeAtob, safeBtoa, isProbablyBase64 } from "./safe-atob"
import type { Stats, JournalEntry, Todo, CheckInData, Habit, Mission, Profile } from "@/lib/types"

// Export constants for backward compatibility
export const DATA_VERSION = "1.2.0"
export const STORAGE_KEYS = {
  USER_DATA: "life_os_user_data",
  BACKUP_DATA: "life_os_backup_data",
  SETTINGS: "life_os_settings",
  VERSION: "life_os_version",
} as const

export interface UserData {
  version: string
  profile: Profile
  stats: Stats
  habits: Habit[]
  journalEntries: JournalEntry[]
  checkIns: CheckInData[]
  todos: Todo[]
  missions: Mission[]
  settings: {
    preferredCheckInTime: string
    notificationsEnabled: boolean
    backupEnabled: boolean
    encryptionEnabled: boolean
  }
  lastModified: string
  lastBackup?: string
}

class DataManagerClass {
  private pwaManager: PWAManager
  private isInitialized = false

  constructor() {
    this.pwaManager = PWAManager.getInstance()
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

      if (!currentVersion || currentVersion !== DATA_VERSION) {
        console.log("🔄 Migrating data to version", DATA_VERSION)

        // Perform migration logic here
        const userData = await this.loadCompleteData()
        userData.version = DATA_VERSION
        await this.saveCompleteData(userData)

        localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION)
        console.log("✅ Data migration completed")
      }
    } catch (error) {
      console.error("❌ Data migration failed:", error)
    }
  }

  private setupAutomaticBackup(): void {
    // Backup every 30 minutes
    setInterval(
      async () => {
        try {
          await this.createBackup()
        } catch (error) {
          console.error("❌ Automatic backup failed:", error)
        }
      },
      30 * 60 * 1000,
    )
  }

  private setupCleanup(): void {
    // Cleanup old data every hour
    setInterval(
      () => {
        this.cleanupOldData()
      },
      60 * 60 * 1000,
    )
  }

  async loadCompleteData(): Promise<UserData> {
    try {
      const rawData = localStorage.getItem(STORAGE_KEYS.USER_DATA)

      if (!rawData) {
        return this.getDefaultUserData()
      }

      const parsedData = this.parsePossiblyEncrypted(rawData)

      // Validate and merge with defaults
      const defaultData = this.getDefaultUserData()
      const userData = { ...defaultData, ...parsedData }

      // Ensure version is current
      userData.version = DATA_VERSION

      return userData
    } catch (error) {
      console.error("❌ Failed to load user data:", error)
      return this.getDefaultUserData()
    }
  }

  async saveCompleteData(userData: UserData): Promise<void> {
    try {
      userData.lastModified = new Date().toISOString()
      userData.version = DATA_VERSION

      const dataToSave = JSON.stringify(userData)
      const encryptedData = userData.settings.encryptionEnabled ? safeBtoa(dataToSave) : dataToSave

      localStorage.setItem(STORAGE_KEYS.USER_DATA, encryptedData)

      // Also save to backup if enabled
      if (userData.settings.backupEnabled) {
        await this.createBackup()
      }
    } catch (error) {
      console.error("❌ Failed to save user data:", error)
      throw error
    }
  }

  private parsePossiblyEncrypted(data: string): any {
    try {
      // First try to parse as regular JSON
      return JSON.parse(data)
    } catch {
      // If that fails, try to decode as base64 first
      if (isProbablyBase64(data)) {
        const decoded = safeAtob(data)
        if (decoded) {
          try {
            return JSON.parse(decoded)
          } catch {
            // If base64 decode worked but JSON parse failed, return empty object
            return {}
          }
        }
      }
      // If all else fails, return empty object
      return {}
    }
  }

  private getDefaultUserData(): UserData {
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
        backupEnabled: true,
        encryptionEnabled: false,
      },
      lastModified: new Date().toISOString(),
    }
  }

  async createBackup(): Promise<void> {
    try {
      const userData = await this.loadCompleteData()
      userData.lastBackup = new Date().toISOString()

      const backupData = {
        ...userData,
        backupCreated: new Date().toISOString(),
      }

      localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, JSON.stringify(backupData))
      console.log("✅ Backup created successfully")
    } catch (error) {
      console.error("❌ Backup creation failed:", error)
      throw error
    }
  }

  async restoreFromBackup(): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP_DATA)

      if (!backupData) {
        throw new Error("No backup data found")
      }

      const parsedBackup = JSON.parse(backupData)
      await this.saveCompleteData(parsedBackup)

      console.log("✅ Data restored from backup")
      return true
    } catch (error) {
      console.error("❌ Backup restoration failed:", error)
      return false
    }
  }

  async exportData(): Promise<string> {
    try {
      const userData = await this.loadCompleteData()
      return JSON.stringify(userData, null, 2)
    } catch (error) {
      console.error("❌ Data export failed:", error)
      throw error
    }
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const importedData = JSON.parse(jsonData)

      // Validate imported data structure
      if (!this.validateUserData(importedData)) {
        throw new Error("Invalid data format")
      }

      await this.saveCompleteData(importedData)
      console.log("✅ Data imported successfully")
      return true
    } catch (error) {
      console.error("❌ Data import failed:", error)
      return false
    }
  }

  private validateUserData(data: any): boolean {
    return (
      data &&
      typeof data === "object" &&
      data.profile &&
      data.stats &&
      Array.isArray(data.habits) &&
      Array.isArray(data.journalEntries) &&
      Array.isArray(data.checkIns) &&
      Array.isArray(data.todos) &&
      Array.isArray(data.missions)
    )
  }

  private cleanupOldData(): void {
    try {
      // Remove old journal entries (older than 1 year)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      // This would be implemented based on specific cleanup requirements
      console.log("🧹 Cleanup routine executed")
    } catch (error) {
      console.error("❌ Cleanup failed:", error)
    }
  }

  getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }

      // Estimate total available (5MB typical limit)
      const total = 5 * 1024 * 1024
      const percentage = (used / total) * 100

      return { used, total, percentage }
    } catch (error) {
      console.error("❌ Failed to calculate storage usage:", error)
      return { used: 0, total: 0, percentage: 0 }
    }
  }
}

// Create singleton instance
export const DataManager = new DataManagerClass()

// Generate daily missions
export function generateDailyMissions(): Mission[] {
  const today = new Date()
  const missions: Mission[] = [
    {
      id: `mission_${today.toDateString()}_1`,
      title: "Morning Reflection",
      description: "Write a journal entry about your goals for today",
      stat: "MIND",
      xpReward: 25,
      completed: false,
      createdAt: today.toISOString(),
      difficulty: "easy",
    },
    {
      id: `mission_${today.toDateString()}_2`,
      title: "Physical Activity",
      description: "Complete at least 30 minutes of physical exercise",
      stat: "BODY",
      xpReward: 30,
      completed: false,
      createdAt: today.toISOString(),
      difficulty: "medium",
    },
    {
      id: `mission_${today.toDateString()}_3`,
      title: "Mindful Moment",
      description: "Take 10 minutes for meditation or deep breathing",
      stat: "SPIRIT",
      xpReward: 20,
      completed: false,
      createdAt: today.toISOString(),
      difficulty: "easy",
    },
  ]

  return missions
}

// Default export for backward compatibility
export default DataManager
