"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import PWAManager from "@/lib/utils/pwa-manager"
import { notificationScheduler } from "@/lib/utils/notification-scheduler"
import { googleCalendar } from "@/lib/utils/google-calendar"
import { offlineSyncManager } from "@/lib/utils/offline-sync"
import {
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  FolderSyncIcon as Sync,
  Database,
  Clock,
  Settings,
} from "lucide-react"

interface PWAStatusInfo {
  isInstalled: boolean
  isStandalone: boolean
  canInstall: boolean
  serviceWorkerRegistered: boolean
  serviceWorkerActive: boolean
  notificationPermission: NotificationPermission
  isOnline: boolean
  cacheStatus: {
    used: number
    total: number
    percentage: number
  }
  scheduledNotifications: number
  calendarConnected: boolean
  syncPending: boolean
}

export default function PWAStatus() {
  const [status, setStatus] = useState<PWAStatusInfo>({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    serviceWorkerRegistered: false,
    serviceWorkerActive: false,
    notificationPermission: "default",
    isOnline: navigator.onLine,
    cacheStatus: { used: 0, total: 0, percentage: 0 },
    scheduledNotifications: 0,
    calendarConnected: false,
    syncPending: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const pwaManager = PWAManager.getInstance()

  useEffect(() => {
    updateStatus()

    const interval = setInterval(updateStatus, 30000) // Update every 30 seconds

    // Listen for network changes
    const handleOnline = () => updateStatus()
    const handleOffline = () => updateStatus()

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Listen for PWA events
    window.addEventListener("pwa-install-available", updateStatus)
    window.addEventListener("pwa-installed", updateStatus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("pwa-install-available", updateStatus)
      window.removeEventListener("pwa-installed", updateStatus)
    }
  }, [])

  const updateStatus = async () => {
    try {
      const installationStatus = pwaManager.getInstallationStatus()
      const serviceWorkerStatus = pwaManager.getServiceWorkerStatus()

      // Get scheduled notifications count
      let scheduledCount = 0
      try {
        const notifications = await notificationScheduler.getScheduledNotifications()
        scheduledCount = notifications.length
      } catch (error) {
        console.warn("Failed to get scheduled notifications count:", error)
      }

      // Check calendar connection
      let calendarConnected = false
      try {
        await googleCalendar.initialize()
        calendarConnected = googleCalendar.isSignedInStatus()
      } catch (error) {
        console.warn("Failed to check calendar status:", error)
      }

      // Estimate cache usage (simplified)
      const cacheStatus = await estimateCacheUsage()

      setStatus({
        isInstalled: installationStatus.isInstalled,
        isStandalone: installationStatus.isStandalone,
        canInstall: installationStatus.canInstall,
        serviceWorkerRegistered: serviceWorkerStatus.isRegistered,
        serviceWorkerActive: serviceWorkerStatus.isActive,
        notificationPermission: Notification.permission,
        isOnline: navigator.onLine,
        cacheStatus,
        scheduledNotifications: scheduledCount,
        calendarConnected,
        syncPending: !offlineSyncManager.isOnline() && offlineSyncManager.isSyncInProgress(),
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to update PWA status:", error)
    }
  }

  const estimateCacheUsage = async (): Promise<{ used: number; total: number; percentage: number }> => {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const used = estimate.usage || 0
        const total = estimate.quota || 0
        const percentage = total > 0 ? (used / total) * 100 : 0

        return { used, total, percentage }
      }
    } catch (error) {
      console.warn("Failed to estimate storage:", error)
    }

    return { used: 0, total: 0, percentage: 0 }
  }

  const installPWA = async () => {
    setIsLoading(true)
    try {
      const success = await pwaManager.showInstallPrompt()
      if (success) {
        setMessage({ type: "success", text: "PWA installation started" })
      } else {
        setMessage({ type: "info", text: "Install prompt not available" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to show install prompt" })
    } finally {
      setIsLoading(false)
    }
  }

  const requestNotificationPermission = async () => {
    setIsLoading(true)
    try {
      const permission = await pwaManager.requestNotificationPermission()
      if (permission === "granted") {
        setMessage({ type: "success", text: "Notification permission granted" })
      } else {
        setMessage({ type: "error", text: "Notification permission denied" })
      }
      await updateStatus()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to request notification permission" })
    } finally {
      setIsLoading(false)
    }
  }

  const testNotification = async () => {
    setIsLoading(true)
    try {
      await notificationScheduler.scheduleReminder(
        "PWA Test Notification",
        "This is a test notification from Life OS PWA!",
        0.1, // 6 seconds
      )
      setMessage({ type: "success", text: "Test notification scheduled" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send test notification" })
    } finally {
      setIsLoading(false)
    }
  }

  const clearCache = async () => {
    setIsLoading(true)
    try {
      await pwaManager.clearCache()
      setMessage({ type: "success", text: "Cache cleared successfully" })
      await updateStatus()
    } catch (error) {
      setMessage({ type: "error", text: "Failed to clear cache" })
    } finally {
      setIsLoading(false)
    }
  }

  const checkForUpdates = async () => {
    setIsLoading(true)
    try {
      await pwaManager.checkForUpdates()
      setMessage({ type: "info", text: "Checked for updates" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to check for updates" })
    } finally {
      setIsLoading(false)
    }
  }

  const triggerSync = async () => {
    setIsLoading(true)
    try {
      await offlineSyncManager.triggerSync()
      setMessage({ type: "success", text: "Sync completed" })
      await updateStatus()
    } catch (error) {
      setMessage({ type: "error", text: "Sync failed" })
    } finally {
      setIsLoading(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
  }

  const getPermissionIcon = (permission: NotificationPermission) => {
    switch (permission) {
      case "granted":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "denied":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Smartphone className="w-6 h-6 mr-3" />
              PWA Status Dashboard
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                v2.0.0
              </Badge>
              <Button
                onClick={updateStatus}
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Alert */}
          {message && (
            <Alert
              className={`border-${message.type === "success" ? "green" : message.type === "error" ? "red" : "blue"}-500/20 bg-${message.type === "success" ? "green" : message.type === "error" ? "red" : "blue"}-500/10`}
            >
              <AlertDescription
                className={`text-${message.type === "success" ? "green" : message.type === "error" ? "red" : "blue"}-200`}
              >
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Installation Status */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Installation Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.isInstalled)}
                  <span className="text-white">PWA Installed</span>
                </div>
                {status.canInstall && !status.isInstalled && (
                  <Button
                    onClick={installPWA}
                    disabled={isLoading}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Install
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.isStandalone)}
                  <span className="text-white">Standalone Mode</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network & Service Worker */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              System Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  {status.isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-white">{status.isOnline ? "Online" : "Offline"}</span>
                </div>
                {!status.isOnline && status.syncPending && (
                  <Button
                    onClick={triggerSync}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    <Sync className="w-4 h-4 mr-1" />
                    Sync
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.serviceWorkerActive)}
                  <span className="text-white">Service Worker</span>
                </div>
                <Button
                  onClick={checkForUpdates}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getPermissionIcon(status.notificationPermission)}
                  <span className="text-white">Permission: {status.notificationPermission}</span>
                </div>
                {status.notificationPermission !== "granted" && (
                  <Button
                    onClick={requestNotificationPermission}
                    disabled={isLoading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Enable
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-white">Scheduled: {status.scheduledNotifications}</span>
                </div>
                {status.notificationPermission === "granted" && (
                  <Button
                    onClick={testNotification}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    Test
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Integrations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.calendarConnected)}
                  <span className="text-white">Google Calendar</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`${status.calendarConnected ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-300"}`}
                >
                  {status.calendarConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(!status.syncPending)}
                  <span className="text-white">Background Sync</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`${status.syncPending ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300"}`}
                >
                  {status.syncPending ? "Pending" : "Up to date"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Storage Usage
            </h3>
            <div className="p-4 bg-white/5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white">
                  {formatBytes(status.cacheStatus.used)} / {formatBytes(status.cacheStatus.total)}
                </span>
                <span className="text-gray-400">{status.cacheStatus.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={status.cacheStatus.percentage} className="w-full h-2 bg-white/10" />
              <div className="flex justify-end">
                <Button
                  onClick={clearCache}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Clear Cache
                </Button>
              </div>
            </div>
          </div>

          {/* Last Update */}
          <div className="text-center text-gray-400 text-sm">Last updated: {lastUpdate.toLocaleTimeString()}</div>
        </CardContent>
      </Card>
    </div>
  )
}
