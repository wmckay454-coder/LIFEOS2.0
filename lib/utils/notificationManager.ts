export class NotificationManager {
  private static permission: NotificationPermission = 'default'

  // Request notification permission
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted'
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    }

    return false
  }

  // Show notification
  static showNotification(title: string, options: {
    body?: string
    icon?: string
    tag?: string
    requireInteraction?: boolean
  } = {}): void {
    if (this.permission !== 'granted') return

    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      badge: '/favicon.ico'
    })

    // Auto-close after 5 seconds unless requireInteraction is true
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000)
    }
  }

  // Schedule habit reminders
  static scheduleHabitReminders(habits: any[], onHabitReminder: (habitName: string) => void): void {
    // Clear existing reminders
    this.clearScheduledReminders()

    habits.forEach(habit => {
      // Schedule reminder for incomplete habits
      const today = new Date().toDateString()
      if (!habit.completionHistory.includes(today)) {
        this.scheduleHabitReminder(habit.name, onHabitReminder)
      }
    })
  }

  // Schedule individual habit reminder
  private static scheduleHabitReminder(habitName: string, callback: (habitName: string) => void): void {
    const now = new Date()
    const reminderTime = new Date()
    
    // Set reminder for 8 PM if it's before 8 PM, otherwise tomorrow at 8 PM
    reminderTime.setHours(20, 0, 0, 0)
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime()

    setTimeout(() => {
      this.showNotification(`Habit Reminder: ${habitName}`, {
        body: 'Don\'t forget to complete your habit today!',
        tag: `habit-${habitName}`,
        requireInteraction: false
      })
      callback(habitName)
    }, timeUntilReminder)
  }

  // Schedule check-in reminder
  static scheduleCheckInReminder(preferredTime: string, onCheckInReminder: () => void): void {
    const [hours, minutes] = preferredTime.split(':').map(Number)
    const now = new Date()
    const reminderTime = new Date()
    
    reminderTime.setHours(hours, minutes, 0, 0)
    
    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime()

    setTimeout(() => {
      this.showNotification('Daily Check-In Time!', {
        body: 'Take a moment to reflect on your day and set your intentions.',
        tag: 'daily-checkin',
        requireInteraction: true
      })
      onCheckInReminder()
    }, timeUntilReminder)
  }

  // Show backup reminder
  static showBackupReminder(onBackup: () => void): void {
    this.showNotification('Backup Reminder', {
      body: 'It\'s been a week since your last backup. Keep your progress safe!',
      tag: 'backup-reminder',
      requireInteraction: true
    })
  }

  // Clear all scheduled reminders
  private static clearScheduledReminders(): void {
    // Note: In a real implementation, you'd want to track timeout IDs
    // For now, we rely on the tag system to prevent duplicates
  }

  // Check if notifications are supported and enabled
  static isSupported(): boolean {
    return 'Notification' in window
  }

  static isEnabled(): boolean {
    return this.permission === 'granted'
  }
}
