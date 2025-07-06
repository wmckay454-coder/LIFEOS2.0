export interface ScheduledNotification {
  id: string
  title: string
  body: string
  scheduledTime: number | string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
  reminderMinutes?: number
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  reminderMinutes?: number
}

export class NotificationScheduler {
  private static instance: NotificationScheduler
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {
    this.initialize()
  }

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler()
    }
    return NotificationScheduler.instance
  }

  private async initialize() {
    if ("serviceWorker" in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready
        console.log("NotificationScheduler initialized")
      } catch (error) {
        console.error("Failed to initialize NotificationScheduler:", error)
      }
    }
  }

  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    if (!this.registration) {
      throw new Error("Service Worker not available")
    }

    // Request notification permission if needed
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        throw new Error("Notification permission denied")
      }
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.id)
        } else {
          reject(new Error(event.data.error))
        }
      }

      if (this.registration?.active) {
        this.registration.active.postMessage(
          {
            type: "SCHEDULE_NOTIFICATION",
            data: {
              ...notification,
              scheduledTime:
                typeof notification.scheduledTime === "string"
                  ? new Date(notification.scheduledTime).getTime()
                  : notification.scheduledTime,
            },
          },
          [messageChannel.port2],
        )
      } else {
        reject(new Error("Service Worker not active"))
      }
    })
  }

  async cancelNotification(id: string): Promise<boolean> {
    if (!this.registration?.active) {
      throw new Error("Service Worker not available")
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success)
      }

      this.registration!.active!.postMessage(
        {
          type: "CANCEL_NOTIFICATION",
          data: { id },
        },
        [messageChannel.port2],
      )
    })
  }

  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    if (!this.registration?.active) {
      throw new Error("Service Worker not available")
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.notifications || [])
      }

      this.registration!.active!.postMessage({ type: "GET_SCHEDULED_NOTIFICATIONS" }, [messageChannel.port2])
    })
  }

  async scheduleCalendarNotifications(events: CalendarEvent[]): Promise<void> {
    if (!this.registration?.active) {
      throw new Error("Service Worker not available")
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve()
        } else {
          reject(new Error("Failed to schedule calendar notifications"))
        }
      }

      this.registration!.active!.postMessage(
        {
          type: "SYNC_CALENDAR_EVENTS",
          data: { events },
        },
        [messageChannel.port2],
      )
    })
  }

  // Quick schedule methods
  async scheduleReminder(title: string, body: string, minutes: number): Promise<string> {
    const scheduledTime = Date.now() + minutes * 60 * 1000

    return this.scheduleNotification({
      id: `reminder-${Date.now()}`,
      title,
      body,
      scheduledTime,
      data: { type: "reminder", minutes },
    })
  }

  async scheduleDailyReminder(title: string, body: string, hour: number, minute = 0): Promise<string> {
    const now = new Date()
    const scheduledDate = new Date()
    scheduledDate.setHours(hour, minute, 0, 0)

    // If time has passed today, schedule for tomorrow
    if (scheduledDate.getTime() <= now.getTime()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1)
    }

    return this.scheduleNotification({
      id: `daily-${Date.now()}`,
      title,
      body,
      scheduledTime: scheduledDate.getTime(),
      data: { type: "daily", hour, minute },
    })
  }

  async scheduleTaskReminder(taskTitle: string, dueDate: string, reminderMinutes = 15): Promise<string> {
    const dueTime = new Date(dueDate).getTime()
    const reminderTime = dueTime - reminderMinutes * 60 * 1000

    if (reminderTime <= Date.now()) {
      throw new Error("Reminder time is in the past")
    }

    return this.scheduleNotification({
      id: `task-${Date.now()}`,
      title: `Task Due Soon: ${taskTitle}`,
      body: `Due in ${reminderMinutes} minutes`,
      scheduledTime: reminderTime,
      data: { type: "task", taskTitle, dueDate, reminderMinutes },
    })
  }
}

export const notificationScheduler = NotificationScheduler.getInstance()
