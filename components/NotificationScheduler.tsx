"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notificationScheduler, type ScheduledNotification } from "@/lib/utils/notification-scheduler"
import { googleCalendar, type GoogleCalendarEvent } from "@/lib/utils/google-calendar"
import { offlineSyncManager } from "@/lib/utils/offline-sync"
import {
  Bell,
  Calendar,
  Clock,
  Trash2,
  Plus,
  FolderSyncIcon as Sync,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  ChromeIcon as Google,
} from "lucide-react"

export default function NotificationScheduler() {
  // State for scheduled notifications
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  // State for new notification form
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [notificationType, setNotificationType] = useState("custom")

  // State for quick reminders
  const [reminderMinutes, setReminderMinutes] = useState("15")
  const [reminderTitle, setReminderTitle] = useState("")
  const [reminderBody, setReminderBody] = useState("")

  // State for daily reminders
  const [dailyHour, setDailyHour] = useState("09")
  const [dailyMinute, setDailyMinute] = useState("00")
  const [dailyTitle, setDailyTitle] = useState("")
  const [dailyBody, setDailyBody] = useState("")

  // State for Google Calendar
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([])
  const [isCalendarSignedIn, setIsCalendarSignedIn] = useState(false)
  const [isCalendarLoading, setIsCalendarLoading] = useState(false)

  // State for offline sync
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncInProgress, setSyncInProgress] = useState(false)

  useEffect(() => {
    loadScheduledNotifications()
    checkCalendarStatus()

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await notificationScheduler.getScheduledNotifications()
      setScheduledNotifications(notifications)
    } catch (error) {
      console.error("Failed to load scheduled notifications:", error)
    }
  }

  const checkCalendarStatus = async () => {
    try {
      await googleCalendar.initialize()
      setIsCalendarSignedIn(googleCalendar.isSignedInStatus())
    } catch (error) {
      console.error("Failed to check calendar status:", error)
    }
  }

  const scheduleNotification = async () => {
    if (!title.trim() || !body.trim() || !scheduledDate || !scheduledTime) {
      setMessage({ type: "error", text: "Please fill in all fields" })
      return
    }

    setIsLoading(true)
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)

      if (scheduledDateTime <= new Date()) {
        setMessage({ type: "error", text: "Please select a future date and time" })
        return
      }

      const notification: ScheduledNotification = {
        id: `custom-${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        scheduledTime: scheduledDateTime.getTime(),
        data: { type: notificationType },
      }

      if (!isOnline) {
        // Store offline
        await offlineSyncManager.addOfflineTask("custom", notification)
        setMessage({ type: "info", text: "Notification scheduled offline - will sync when online" })
      } else {
        await notificationScheduler.scheduleNotification(notification)
        setMessage({ type: "success", text: `Notification scheduled for ${scheduledDateTime.toLocaleString()}` })
      }

      // Clear form
      setTitle("")
      setBody("")
      setScheduledDate("")
      setScheduledTime("")

      await loadScheduledNotifications()
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to schedule notification" })
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleQuickReminder = async () => {
    if (!reminderTitle.trim() || !reminderBody.trim()) {
      setMessage({ type: "error", text: "Please fill in reminder title and body" })
      return
    }

    setIsLoading(true)
    try {
      const minutes = Number.parseInt(reminderMinutes)
      await notificationScheduler.scheduleReminder(reminderTitle, reminderBody, minutes)

      setMessage({ type: "success", text: `Reminder set for ${minutes} minutes from now` })
      setReminderTitle("")
      setReminderBody("")

      await loadScheduledNotifications()
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to schedule reminder" })
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleDailyReminder = async () => {
    if (!dailyTitle.trim() || !dailyBody.trim()) {
      setMessage({ type: "error", text: "Please fill in daily reminder details" })
      return
    }

    setIsLoading(true)
    try {
      const hour = Number.parseInt(dailyHour)
      const minute = Number.parseInt(dailyMinute)

      await notificationScheduler.scheduleDailyReminder(dailyTitle, dailyBody, hour, minute)

      setMessage({
        type: "success",
        text: `Daily reminder set for ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      })
      setDailyTitle("")
      setDailyBody("")

      await loadScheduledNotifications()
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to schedule daily reminder" })
    } finally {
      setIsLoading(false)
    }
  }

  const cancelNotification = async (id: string) => {
    try {
      await notificationScheduler.cancelNotification(id)
      setMessage({ type: "success", text: "Notification cancelled" })
      await loadScheduledNotifications()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to cancel notification" })
    }
  }

  const signInToCalendar = async () => {
    setIsCalendarLoading(true)
    try {
      const success = await googleCalendar.signIn()
      setIsCalendarSignedIn(success)

      if (success) {
        setMessage({ type: "success", text: "Successfully signed in to Google Calendar" })
        await loadCalendarEvents()
      } else {
        setMessage({ type: "error", text: "Failed to sign in to Google Calendar" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Calendar sign-in failed" })
    } finally {
      setIsCalendarLoading(false)
    }
  }

  const signOutFromCalendar = async () => {
    try {
      await googleCalendar.signOut()
      setIsCalendarSignedIn(false)
      setCalendarEvents([])
      setMessage({ type: "info", text: "Signed out from Google Calendar" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to sign out" })
    }
  }

  const loadCalendarEvents = async () => {
    if (!isCalendarSignedIn) return

    setIsCalendarLoading(true)
    try {
      const events = await googleCalendar.getUpcomingEvents(168) // Next 7 days
      setCalendarEvents(events)
      setMessage({ type: "success", text: `Loaded ${events.length} calendar events` })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load calendar events" })
    } finally {
      setIsCalendarLoading(false)
    }
  }

  const scheduleCalendarNotifications = async () => {
    if (calendarEvents.length === 0) {
      setMessage({ type: "error", text: "No calendar events to schedule" })
      return
    }

    setIsLoading(true)
    try {
      await notificationScheduler.scheduleCalendarNotifications(calendarEvents)
      setMessage({ type: "success", text: `Scheduled notifications for ${calendarEvents.length} calendar events` })
      await loadScheduledNotifications()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to schedule calendar notifications" })
    } finally {
      setIsLoading(false)
    }
  }

  const triggerSync = async () => {
    setSyncInProgress(true)
    try {
      await offlineSyncManager.triggerSync()
      setMessage({ type: "success", text: "Sync completed successfully" })
    } catch (error) {
      setMessage({ type: "error", text: "Sync failed" })
    } finally {
      setSyncInProgress(false)
    }
  }

  const dismissMessage = () => {
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-6 h-6 mr-3" />
              Advanced Notification Scheduler
            </div>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  <Wifi className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-500/20 text-red-300">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
              {!isOnline && (
                <Button
                  onClick={triggerSync}
                  disabled={syncInProgress}
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <Sync className={`w-4 h-4 mr-1 ${syncInProgress ? "animate-spin" : ""}`} />
                  Sync
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Message Alert */}
          {message && (
            <Alert
              className={`mb-6 border-${message.type === "success" ? "green" : message.type === "error" ? "red" : "blue"}-500/20 bg-${message.type === "success" ? "green" : message.type === "error" ? "red" : "blue"}-500/10`}
            >
              <AlertDescription
                className={`text-${message.type === "success" ? "green" : message.type === "error" ? "red" : "blue"}-200 flex items-center justify-between`}
              >
                {message.text}
                <Button variant="ghost" size="sm" onClick={dismissMessage} className="text-gray-400 hover:text-white">
                  <XCircle className="w-4 h-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="custom" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="custom" className="text-white data-[state=active]:bg-purple-600">
                Custom
              </TabsTrigger>
              <TabsTrigger value="quick" className="text-white data-[state=active]:bg-purple-600">
                Quick
              </TabsTrigger>
              <TabsTrigger value="daily" className="text-white data-[state=active]:bg-purple-600">
                Daily
              </TabsTrigger>
              <TabsTrigger value="calendar" className="text-white data-[state=active]:bg-purple-600">
                Calendar
              </TabsTrigger>
            </TabsList>

            {/* Custom Notifications */}
            <TabsContent value="custom" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Notification title"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-white">
                    Type
                  </Label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="body" className="text-white">
                  Message
                </Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Notification message"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-white">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="time" className="text-white">
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={scheduleNotification}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isLoading ? "Scheduling..." : "Schedule Notification"}
              </Button>
            </TabsContent>

            {/* Quick Reminders */}
            <TabsContent value="quick" className="space-y-4">
              <div>
                <Label htmlFor="reminderMinutes" className="text-white">
                  Remind me in
                </Label>
                <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reminderTitle" className="text-white">
                  Title
                </Label>
                <Input
                  id="reminderTitle"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="Reminder title"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="reminderBody" className="text-white">
                  Message
                </Label>
                <Textarea
                  id="reminderBody"
                  value={reminderBody}
                  onChange={(e) => setReminderBody(e.target.value)}
                  placeholder="Reminder message"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <Button
                onClick={scheduleQuickReminder}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                {isLoading ? "Setting..." : "Set Quick Reminder"}
              </Button>
            </TabsContent>

            {/* Daily Reminders */}
            <TabsContent value="daily" className="space-y-4">
              <div>
                <Label className="text-white">Daily reminder time</Label>
                <div className="flex space-x-2">
                  <Select value={dailyHour} onValueChange={setDailyHour}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                          {i.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-white">:</span>
                  <Select value={dailyMinute} onValueChange={setDailyMinute}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["00", "15", "30", "45"].map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="dailyTitle" className="text-white">
                  Title
                </Label>
                <Input
                  id="dailyTitle"
                  value={dailyTitle}
                  onChange={(e) => setDailyTitle(e.target.value)}
                  placeholder="Daily reminder title"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="dailyBody" className="text-white">
                  Message
                </Label>
                <Textarea
                  id="dailyBody"
                  value={dailyBody}
                  onChange={(e) => setDailyBody(e.target.value)}
                  placeholder="Daily reminder message"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <Button
                onClick={scheduleDailyReminder}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {isLoading ? "Setting..." : "Set Daily Reminder"}
              </Button>
            </TabsContent>

            {/* Google Calendar Integration */}
            <TabsContent value="calendar" className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <Google className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-white font-medium">Google Calendar</p>
                    <p className="text-gray-400 text-sm">{isCalendarSignedIn ? "Connected" : "Not connected"}</p>
                  </div>
                </div>
                {isCalendarSignedIn ? (
                  <div className="flex space-x-2">
                    <Button
                      onClick={loadCalendarEvents}
                      disabled={isCalendarLoading}
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    >
                      <Sync className={`w-4 h-4 mr-1 ${isCalendarLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    <Button
                      onClick={signOutFromCalendar}
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={signInToCalendar}
                    disabled={isCalendarLoading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCalendarLoading ? "Connecting..." : "Connect"}
                  </Button>
                )}
              </div>

              {isCalendarSignedIn && calendarEvents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Upcoming Events ({calendarEvents.length})</h3>
                    <Button
                      onClick={scheduleCalendarNotifications}
                      disabled={isLoading}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Bell className="w-4 h-4 mr-1" />
                      Schedule All
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {calendarEvents.map((event) => (
                      <div key={event.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-medium">{event.summary}</p>
                            <p className="text-gray-400 text-sm">
                              {new Date(event.start.dateTime || event.start.date || "").toLocaleString()}
                            </p>
                            {event.description && (
                              <p className="text-gray-300 text-xs mt-1 truncate">{event.description}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 ml-2">
                            {googleCalendar.getDefaultReminderMinutes(event)}m
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isCalendarSignedIn && calendarEvents.length === 0 && !isCalendarLoading && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No upcoming events found</p>
                  <Button
                    onClick={loadCalendarEvents}
                    size="sm"
                    variant="outline"
                    className="mt-2 border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    Refresh Events
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Scheduled Notifications List */}
          {scheduledNotifications.length > 0 && (
            <div className="mt-8 space-y-3">
              <h3 className="text-white font-semibold flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Scheduled Notifications ({scheduledNotifications.length})
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {scheduledNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{notification.title}</p>
                      <p className="text-gray-400 text-sm">{notification.body}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-400 text-xs">
                          {new Date(notification.scheduledTime).toLocaleString()}
                        </span>
                        {notification.data?.type && (
                          <Badge variant="secondary" className="bg-gray-500/20 text-gray-300 text-xs">
                            {notification.data.type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => cancelNotification(notification.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline Mode Info */}
          {!isOnline && (
            <Alert className="mt-6 border-yellow-500/20 bg-yellow-500/10">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-yellow-200">
                <div className="space-y-2">
                  <p>You're currently offline. Notifications will be:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Stored locally and synced when you're back online</li>
                    <li>Scheduled using device timers (limited to ~24 days)</li>
                    <li>Available for immediate scheduling upon reconnection</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
