"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PWAManager, type ScheduledNotification } from "@/lib/utils/pwa-manager"
import { Bell, BellOff, Clock, AlertCircle, CheckCircle, X } from "lucide-react"

interface NotificationSchedulerProps {
  onNotificationScheduled?: (notification: ScheduledNotification) => void
  onNotificationCancelled?: (id: string) => void
}

export default function NotificationScheduler({
  onNotificationScheduled,
  onNotificationCancelled,
}: NotificationSchedulerProps) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [isScheduling, setIsScheduling] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [scheduledNotifications, setScheduledNotifications] = useState<string[]>([])
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  const pwaManager = PWAManager.getInstance()

  useEffect(() => {
    checkNotificationSupport()
    loadScheduledNotifications()
  }, [])

  const checkNotificationSupport = async () => {
    if (!pwaManager.isNotificationSupported()) {
      setMessage({
        type: "error",
        text: "Notifications are not supported in this browser",
      })
      return
    }

    const currentPermission = pwaManager.getNotificationPermission()
    setPermission(currentPermission)

    if (currentPermission === "denied") {
      setMessage({
        type: "error",
        text: "Notifications are blocked. Please enable them in your browser settings.",
      })
    }
  }

  const loadScheduledNotifications = () => {
    const scheduled = pwaManager.getScheduledNotifications()
    setScheduledNotifications(scheduled)
  }

  const requestPermission = async () => {
    try {
      const newPermission = await pwaManager.requestNotificationPermission()
      setPermission(newPermission)

      if (newPermission === "granted") {
        setMessage({
          type: "success",
          text: "Notification permission granted! You can now schedule notifications.",
        })
      } else if (newPermission === "denied") {
        setMessage({
          type: "error",
          text: "Notification permission denied. Please enable notifications in your browser settings.",
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to request notification permission",
      })
    }
  }

  const scheduleNotification = async () => {
    if (!title.trim() || !body.trim() || !scheduledDate || !scheduledTime) {
      setMessage({
        type: "error",
        text: "Please fill in all fields",
      })
      return
    }

    setIsScheduling(true)

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      const now = new Date()

      if (scheduledDateTime <= now) {
        setMessage({
          type: "error",
          text: "Please select a future date and time",
        })
        setIsScheduling(false)
        return
      }

      const notification: ScheduledNotification = {
        id: `notification-${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        scheduledTime: scheduledDateTime.getTime(),
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: `scheduled-${Date.now()}`,
        data: {
          scheduledAt: new Date().toISOString(),
          url: "/",
        },
      }

      const success = await pwaManager.scheduleNotification(notification)

      if (success) {
        setMessage({
          type: "success",
          text: `Notification scheduled for ${scheduledDateTime.toLocaleString()}`,
        })

        // Clear form
        setTitle("")
        setBody("")
        setScheduledDate("")
        setScheduledTime("")

        // Reload scheduled notifications
        loadScheduledNotifications()

        // Notify parent component
        onNotificationScheduled?.(notification)
      } else {
        setMessage({
          type: "error",
          text: "Failed to schedule notification. Please check your notification permissions.",
        })
      }
    } catch (error) {
      console.error("Error scheduling notification:", error)
      setMessage({
        type: "error",
        text: "An error occurred while scheduling the notification",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const cancelNotification = (id: string) => {
    const success = pwaManager.cancelScheduledNotification(id)

    if (success) {
      setMessage({
        type: "success",
        text: "Notification cancelled successfully",
      })
      loadScheduledNotifications()
      onNotificationCancelled?.(id)
    } else {
      setMessage({
        type: "error",
        text: "Failed to cancel notification",
      })
    }
  }

  const testNotification = async () => {
    if (permission !== "granted") {
      await requestPermission()
      return
    }

    const testNotif: ScheduledNotification = {
      id: `test-${Date.now()}`,
      title: "Test Notification",
      body: "This is a test notification from Life OS!",
      scheduledTime: Date.now() + 1000, // 1 second from now
      icon: "/icon-192x192.png",
      tag: "test",
    }

    const success = await pwaManager.scheduleNotification(testNotif)

    if (success) {
      setMessage({
        type: "success",
        text: "Test notification will appear in 1 second",
      })
    }
  }

  const dismissMessage = () => {
    setMessage(null)
  }

  const getPermissionStatus = () => {
    switch (permission) {
      case "granted":
        return { icon: CheckCircle, color: "text-green-500", text: "Granted" }
      case "denied":
        return { icon: BellOff, color: "text-red-500", text: "Denied" }
      default:
        return { icon: AlertCircle, color: "text-yellow-500", text: "Not requested" }
    }
  }

  const permissionStatus = getPermissionStatus()
  const PermissionIcon = permissionStatus.icon

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center">
            <Bell className="w-6 h-6 mr-3" />
            Schedule Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-3">
              <PermissionIcon className={`w-5 h-5 ${permissionStatus.color}`} />
              <span className="text-white font-medium">Notification Permission: {permissionStatus.text}</span>
            </div>
            {permission !== "granted" && (
              <Button
                onClick={requestPermission}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Request Permission
              </Button>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`p-4 rounded-lg border flex items-center justify-between ${
                message.type === "success"
                  ? "bg-green-500/10 border-green-500/20 text-green-300"
                  : message.type === "error"
                    ? "bg-red-500/10 border-red-500/20 text-red-300"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-300"
              }`}
            >
              <span>{message.text}</span>
              <Button onClick={dismissMessage} variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/10">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Notification Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white font-medium">
                Notification Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title..."
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="body" className="text-white font-medium">
                Notification Message
              </Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter notification message..."
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-[80px]"
                maxLength={300}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-white font-medium">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>

              <div>
                <Label htmlFor="time" className="text-white font-medium">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={scheduleNotification}
                disabled={isScheduling || permission !== "granted"}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isScheduling ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule Notification
                  </>
                )}
              </Button>

              <Button
                onClick={testNotification}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Test Now
              </Button>
            </div>
          </div>

          {/* Scheduled Notifications */}
          {scheduledNotifications.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Scheduled Notifications ({scheduledNotifications.length})
              </h3>
              <div className="space-y-2">
                {scheduledNotifications.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                        Scheduled
                      </Badge>
                      <span className="text-white text-sm">{id}</span>
                    </div>
                    <Button
                      onClick={() => cancelNotification(id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback Message */}
          {!pwaManager.isNotificationSupported() && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-300">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Notifications Not Supported</span>
              </div>
              <p className="text-yellow-200 text-sm mt-2">
                Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or
                Safari to enable this feature.
              </p>
            </div>
          )}

          {permission === "denied" && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2 text-red-300">
                <BellOff className="w-5 h-5" />
                <span className="font-medium">Notifications Blocked</span>
              </div>
              <p className="text-red-200 text-sm mt-2">Notifications are currently blocked. To enable them:</p>
              <ul className="text-red-200 text-sm mt-2 ml-4 list-disc">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Set notifications to "Allow"</li>
                <li>Refresh the page and try again</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
