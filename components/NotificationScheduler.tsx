"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import PWAManager, { type ScheduledNotification } from "@/lib/utils/pwa-manager"
import { Bell, BellOff, Clock, Trash2, CheckCircle, XCircle, AlertTriangle, X } from "lucide-react"

interface NotificationSchedulerProps {
  onNotificationScheduled?: (notification: ScheduledNotification) => void
  onNotificationCancelled?: (id: string) => void
}

export default function NotificationScheduler({
  onNotificationScheduled,
  onNotificationCancelled,
}: NotificationSchedulerProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  // Form state
  const [title, setTitle] = useState("Life OS Reminder")
  const [body, setBody] = useState("Time to check in with your goals!")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")

  const pwaManager = PWAManager.getInstance()

  useEffect(() => {
    checkNotificationSupport()
    loadScheduledNotifications()
  }, [])

  const checkNotificationSupport = () => {
    const supported = "Notification" in window && "serviceWorker" in navigator
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
    }
  }

  const loadScheduledNotifications = () => {
    const notifications = pwaManager.getScheduledNotifications()
    setScheduledNotifications(notifications)
  }

  const requestPermission = async () => {
    if (!isSupported) return

    setIsLoading(true)
    try {
      const result = await pwaManager.requestNotificationPermission()
      setPermission(result)

      if (result === "granted") {
        setMessage({ type: "success", text: "Notification permission granted! You can now schedule notifications." })
      } else if (result === "denied") {
        setMessage({
          type: "error",
          text: "Notification permission denied. Please enable notifications in your browser settings to use this feature.",
        })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to request notification permission." })
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleNotification = async () => {
    if (!title.trim() || !body.trim() || !scheduledDate || !scheduledTime) {
      setMessage({ type: "error", text: "Please fill in all fields." })
      return
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)

    if (scheduledDateTime <= new Date()) {
      setMessage({ type: "error", text: "Please select a future date and time." })
      return
    }

    setIsLoading(true)
    try {
      const id = await pwaManager.scheduleNotification(title, body, scheduledDateTime, {
        tag: `scheduled-${Date.now()}`,
        requireInteraction: true,
        actions: [
          { action: "open", title: "Open Life OS" },
          { action: "dismiss", title: "Dismiss" },
        ],
      })

      loadScheduledNotifications()
      setMessage({
        type: "success",
        text: `Notification scheduled for ${scheduledDateTime.toLocaleString()}`,
      })

      // Clear form
      setTitle("Life OS Reminder")
      setBody("Time to check in with your goals!")
      setScheduledDate("")
      setScheduledTime("")

      const notification = pwaManager.getScheduledNotifications().find((n) => n.id === id)
      if (notification && onNotificationScheduled) {
        onNotificationScheduled(notification)
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to schedule notification",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const cancelNotification = (id: string) => {
    const success = pwaManager.cancelScheduledNotification(id)
    if (success) {
      loadScheduledNotifications()
      setMessage({ type: "info", text: "Notification cancelled successfully." })
      if (onNotificationCancelled) {
        onNotificationCancelled(id)
      }
    } else {
      setMessage({ type: "error", text: "Failed to cancel notification." })
    }
  }

  const testNotification = async () => {
    setIsLoading(true)
    try {
      await pwaManager.testNotification()
      setMessage({ type: "success", text: "Test notification sent!" })
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send test notification",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const dismissMessage = () => {
    setMessage(null)
  }

  const getPermissionIcon = () => {
    switch (permission) {
      case "granted":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "denied":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getPermissionText = () => {
    switch (permission) {
      case "granted":
        return "Notifications enabled"
      case "denied":
        return "Notifications blocked"
      default:
        return "Notifications not requested"
    }
  }

  if (!isSupported) {
    return (
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <BellOff className="w-6 h-6 mr-3" />
            Notification Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-yellow-200">
              Notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or
              Safari to enable notification scheduling.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Bell className="w-6 h-6 mr-3" />
            Notification Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-3">
              {getPermissionIcon()}
              <div>
                <p className="text-white font-medium">{getPermissionText()}</p>
                <p className="text-gray-400 text-sm">
                  {permission === "granted"
                    ? "You can schedule and receive notifications"
                    : permission === "denied"
                      ? "Enable notifications in browser settings"
                      : "Click to enable notifications"}
                </p>
              </div>
            </div>
            {permission !== "granted" && (
              <Button onClick={requestPermission} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                {isLoading ? "Requesting..." : "Enable Notifications"}
              </Button>
            )}
          </div>

          {/* Message Alert */}
          {message && (
            <Alert
              className={`border-${message.type === "success" ? "green" : message.type === "error" ? "red" : "blue"}-500/20 bg-${message.type === "success" ? "green" : message.type === "error" ? "red" : "blue"}-500/10`}
            >
              <div className="flex items-center justify-between">
                <AlertDescription
                  className={`text-${message.type === "success" ? "green" : message.type === "error" ? "red" : "blue"}-200`}
                >
                  {message.text}
                </AlertDescription>
                <Button variant="ghost" size="sm" onClick={dismissMessage} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Alert>
          )}

          {permission === "granted" && (
            <>
              {/* Scheduling Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Notification Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="body" className="text-white">
                    Notification Message
                  </Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter notification message"
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

                <div className="flex space-x-3">
                  <Button
                    onClick={scheduleNotification}
                    disabled={isLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    {isLoading ? "Scheduling..." : "Schedule Notification"}
                  </Button>
                  <Button
                    onClick={testNotification}
                    disabled={isLoading}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    Test Now
                  </Button>
                </div>
              </div>

              {/* Scheduled Notifications List */}
              {scheduledNotifications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold">Scheduled Notifications</h3>
                  {scheduledNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{notification.title}</p>
                        <p className="text-gray-400 text-sm">{notification.body}</p>
                        <div className="flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1 text-purple-400" />
                          <span className="text-purple-400 text-xs">
                            {new Date(notification.scheduledTime).toLocaleString()}
                          </span>
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
              )}
            </>
          )}

          {permission === "denied" && (
            <Alert className="border-red-500/20 bg-red-500/10">
              <XCircle className="w-4 h-4" />
              <AlertDescription className="text-red-200">
                <div className="space-y-2">
                  <p>Notifications are currently blocked. To enable them:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click the lock icon in your browser's address bar</li>
                    <li>Set "Notifications" to "Allow"</li>
                    <li>Refresh this page</li>
                  </ol>
                  <p className="text-xs">
                    Alternatively, go to your browser settings and allow notifications for this site.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
