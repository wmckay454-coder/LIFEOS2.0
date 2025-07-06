"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Smartphone,
  Download,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Settings,
} from "lucide-react"
import { pwaManager } from "@/lib/utils/pwa-manager"

function PWAStatus() {
  const [installStatus, setInstallStatus] = useState({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
  })

  const [serviceWorkerStatus, setServiceWorkerStatus] = useState({
    isRegistered: false,
    isActive: false,
    version: null as string | null,
  })

  const [isOnline, setIsOnline] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [isLoading, setIsLoading] = useState(false)
  const [testNotificationData, setTestNotificationData] = useState({
    title: "Test Notification",
    body: "This is a test notification from Life OS!",
    useAPI: false,
  })

  useEffect(() => {
    updateStatus()

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Listen for PWA events
    const handleInstallAvailable = () => updateStatus()
    const handleInstalled = () => updateStatus()

    window.addEventListener("pwa-install-available", handleInstallAvailable)
    window.addEventListener("pwa-installed", handleInstalled)

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("pwa-install-available", handleInstallAvailable)
      window.removeEventListener("pwa-installed", handleInstalled)
    }
  }, [])

  const updateStatus = () => {
    setInstallStatus(pwaManager.getInstallationStatus())
    setServiceWorkerStatus(pwaManager.getServiceWorkerStatus())
    setIsOnline(navigator.onLine)
  }

  const handleInstall = async () => {
    setIsLoading(true)
    try {
      const success = await pwaManager.showInstallPrompt()
      if (success) {
        console.log("PWA installation initiated")
        updateStatus()
      }
    } catch (error) {
      console.error("Failed to install PWA:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestNotificationPermission = async () => {
    setIsLoading(true)
    try {
      const permission = await pwaManager.requestNotificationPermission()
      setNotificationPermission(permission)
    } catch (error) {
      console.error("Failed to request notification permission:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    setIsLoading(true)
    try {
      let success = false

      if (testNotificationData.useAPI) {
        // Test via API endpoint
        success = await pwaManager.testNotificationViaAPI({
          title: testNotificationData.title,
          body: testNotificationData.body,
          icon: "/icon-192x192.png",
          data: { test: true, timestamp: Date.now() },
        })
      } else {
        // Test via postMessage to service worker
        success = await pwaManager.testNotification(testNotificationData.title, testNotificationData.body)
      }

      if (success) {
        console.log("Test notification sent successfully")
      } else {
        console.error("Test notification failed")
      }
    } catch (error) {
      console.error("Failed to send test notification:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckUpdates = async () => {
    setIsLoading(true)
    try {
      await pwaManager.checkForUpdates()
      updateStatus()
    } catch (error) {
      console.error("Failed to check for updates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearCache = async () => {
    setIsLoading(true)
    try {
      await pwaManager.clearCache()
      window.location.reload()
    } catch (error) {
      console.error("Failed to clear cache:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean, trueText: string, falseText: string) => {
    return <Badge variant={status ? "default" : "secondary"}>{status ? trueText : falseText}</Badge>
  }

  const getPermissionBadge = (permission: NotificationPermission) => {
    const variants = {
      granted: "default",
      denied: "destructive",
      default: "secondary",
    } as const

    return <Badge variant={variants[permission]}>{permission}</Badge>
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          PWA Status Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Installation Status */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Download className="h-4 w-4" />
            Installation Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Installed</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(installStatus.isInstalled)}
                {getStatusBadge(installStatus.isInstalled, "Yes", "No")}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Standalone</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(installStatus.isStandalone)}
                {getStatusBadge(installStatus.isStandalone, "Yes", "No")}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Can Install</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(installStatus.canInstall)}
                {getStatusBadge(installStatus.canInstall, "Yes", "No")}
              </div>
            </div>
          </div>
          {installStatus.canInstall && (
            <Button onClick={handleInstall} disabled={isLoading} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install Life OS
            </Button>
          )}
        </div>

        <Separator />

        {/* Service Worker Status */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Service Worker Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Registered</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(serviceWorkerStatus.isRegistered)}
                {getStatusBadge(serviceWorkerStatus.isRegistered, "Yes", "No")}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Active</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(serviceWorkerStatus.isActive)}
                {getStatusBadge(serviceWorkerStatus.isActive, "Yes", "No")}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm">Version</span>
              <Badge variant="outline">{serviceWorkerStatus.version || "Unknown"}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Network & Notifications */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Features Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm flex items-center gap-2">
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                Network
              </span>
              {getStatusBadge(isOnline, "Online", "Offline")}
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </span>
              {getPermissionBadge(notificationPermission)}
            </div>
          </div>
          {notificationPermission !== "granted" && (
            <Button
              onClick={handleRequestNotificationPermission}
              disabled={isLoading}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Bell className="h-4 w-4 mr-2" />
              Request Notification Permission
            </Button>
          )}
        </div>

        <Separator />

        {/* Test Notification Section */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Send className="h-4 w-4" />
            Test Notifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notification-title">Title</Label>
              <Input
                id="notification-title"
                value={testNotificationData.title}
                onChange={(e) => setTestNotificationData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-body">Body</Label>
              <Input
                id="notification-body"
                value={testNotificationData.body}
                onChange={(e) => setTestNotificationData((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Notification body"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="use-api"
              checked={testNotificationData.useAPI}
              onChange={(e) => setTestNotificationData((prev) => ({ ...prev, useAPI: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="use-api" className="text-sm">
              Test via API endpoint (simulates push notification)
            </Label>
          </div>
          <Button
            onClick={handleTestNotification}
            disabled={isLoading || notificationPermission !== "granted"}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? "Sending..." : "Send Test Notification"}
          </Button>
          {notificationPermission !== "granted" && (
            <p className="text-sm text-muted-foreground">Notification permission required to test notifications</p>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold">Management Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleCheckUpdates}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check for Updates
            </Button>
            <Button
              onClick={handleClearCache}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache & Reload
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {serviceWorkerStatus.isActive && isOnline ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="font-medium">
              {serviceWorkerStatus.isActive && isOnline ? "PWA is fully functional" : "PWA has limited functionality"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {installStatus.isInstalled
              ? "App is installed and running in standalone mode"
              : "App is running in browser mode"}
          </p>
          {notificationPermission === "granted" && (
            <p className="text-sm text-green-600 mt-1">✓ Notifications are enabled and ready for testing</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { PWAStatus }
export default PWAStatus
