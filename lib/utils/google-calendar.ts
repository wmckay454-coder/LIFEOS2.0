export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: string
      minutes: number
    }>
  }
}

export interface GoogleCalendarConfig {
  clientId: string
  apiKey: string
  discoveryDoc: string
  scopes: string
}

export class GoogleCalendarIntegration {
  private static instance: GoogleCalendarIntegration
  private gapi: any = null
  private isInitialized = false
  private isSignedIn = false

  private config: GoogleCalendarConfig = {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
    discoveryDoc: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    scopes: "https://www.googleapis.com/auth/calendar.readonly",
  }

  private constructor() {}

  static getInstance(): GoogleCalendarIntegration {
    if (!GoogleCalendarIntegration.instance) {
      GoogleCalendarIntegration.instance = new GoogleCalendarIntegration()
    }
    return GoogleCalendarIntegration.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Load Google API
      await this.loadGoogleAPI()

      // Initialize gapi
      await this.gapi.load("client:auth2", async () => {
        await this.gapi.client.init({
          apiKey: this.config.apiKey,
          clientId: this.config.clientId,
          discoveryDocs: [this.config.discoveryDoc],
          scope: this.config.scopes,
        })

        this.isInitialized = true
        this.isSignedIn = this.gapi.auth2.getAuthInstance().isSignedIn.get()

        console.log("Google Calendar API initialized")
      })
    } catch (error) {
      console.error("Failed to initialize Google Calendar API:", error)
      throw error
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && (window as any).gapi) {
        this.gapi = (window as any).gapi
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.onload = () => {
        this.gapi = (window as any).gapi
        resolve()
      }
      script.onerror = () => reject(new Error("Failed to load Google API"))
      document.head.appendChild(script)
    })
  }

  async signIn(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance()

      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn()
      }

      this.isSignedIn = authInstance.isSignedIn.get()
      console.log("Google Calendar sign-in successful")

      return this.isSignedIn
    } catch (error) {
      console.error("Google Calendar sign-in failed:", error)
      return false
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return

    try {
      const authInstance = this.gapi.auth2.getAuthInstance()
      await authInstance.signOut()
      this.isSignedIn = false
      console.log("Google Calendar sign-out successful")
    } catch (error) {
      console.error("Google Calendar sign-out failed:", error)
    }
  }

  async getEvents(timeMin?: string, timeMax?: string, maxResults = 50): Promise<GoogleCalendarEvent[]> {
    if (!this.isInitialized || !this.isSignedIn) {
      throw new Error("Google Calendar not initialized or not signed in")
    }

    try {
      const now = new Date()
      const defaultTimeMin = timeMin || now.toISOString()
      const defaultTimeMax = timeMax || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const response = await this.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: defaultTimeMin,
        timeMax: defaultTimeMax,
        showDeleted: false,
        singleEvents: true,
        maxResults: maxResults,
        orderBy: "startTime",
      })

      return response.result.items || []
    } catch (error) {
      console.error("Failed to fetch calendar events:", error)
      throw error
    }
  }

  async getUpcomingEvents(hours = 24): Promise<GoogleCalendarEvent[]> {
    const now = new Date()
    const timeMax = new Date(now.getTime() + hours * 60 * 60 * 1000)

    return this.getEvents(now.toISOString(), timeMax.toISOString())
  }

  async getTodaysEvents(): Promise<GoogleCalendarEvent[]> {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    return this.getEvents(startOfDay.toISOString(), endOfDay.toISOString())
  }

  getDefaultReminderMinutes(event: GoogleCalendarEvent): number {
    if (event.reminders?.overrides && event.reminders.overrides.length > 0) {
      return event.reminders.overrides[0].minutes
    }

    if (event.reminders?.useDefault) {
      return 15 // Default reminder time
    }

    return 15 // Fallback
  }

  isSignedInStatus(): boolean {
    return this.isSignedIn
  }

  isInitializedStatus(): boolean {
    return this.isInitialized
  }
}

export const googleCalendar = GoogleCalendarIntegration.getInstance()
