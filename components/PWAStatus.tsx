"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Initialize PWA status
    updateStatus()

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Listen for install prompt
    const handleInstallPrompt = (e: any) => {
      setDeferredPrompt(e.detail)
      updateStatus()
    }

    const handleInstalled = () => {
      setDeferredPrompt(null)
      updateStatus()
    }

    window.addEventListener("pwa-install-available", handleInstallPrompt)
    window.addEventListener("pwa-installed", handleInstalled)

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("pwa-install-available", handleInstallPrompt)
      window.removeEventListener("pwa-installed", handleInstalled)
    }
  }, [])

  const updateStatus = () => {
    setInstallStatus(pwaManager.getInstallationStatus())
    setServiceWorkerStatus(pwaManager.getServiceWorkerStatus())
    setIsOnline(navigator.onLine)
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log("Install prompt outcome:", outcome)
      setDeferredPrompt(null)
    }
  }

  const handleNotificationTest = async () => {
    try {
      if (notificationPermission === "default") {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
      }

      if (notificationPermission === "granted") {
        await pwaManager.showNotification("Test Notification", {
          body: "This is a test notification from Life OS!",
          tag: "test-notification",
        })
      }
    } catch (error) {
      console.error("Failed to show test notification:", error)
    }
  }

  const handleCheckUpdates = async () => {
    try {
      await pwaManager.checkForUpdates()
      updateStatus()
    } catch (error) {
      console.error("Failed to check for updates:", error)
    }
  }

  const handleClearCache = async () => {
    try {
      await pwaManager.clearCache()
      window.location.reload()
    } catch (error) {
      console.error("Failed to clear cache:", error)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean, trueText: string, falseText: string) => {
    return <Badge variant={status ? "default" : "secondary"}>{status ? trueText : falseText}</Badge>
  }

  return (
    <Card className="w-full max-w-2xl">
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
          {deferredPrompt && (
            <Button onClick={handleInstall} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install Life OS
            </Button>
          )}
        </div>

        <Separator />

        {/* Service Worker Status */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
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
              <Badge variant={notificationPermission === "granted" ? "default" : "secondary"}>
                {notificationPermission}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold">Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button onClick={handleNotificationTest} variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Test Notification
            </Button>
            <Button onClick={handleCheckUpdates} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Updates
            </Button>
            <Button onClick={handleClearCache} variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
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
        </div>
      </CardContent>
    </Card>
  )
}

export { PWAStatus }
export default PWAStatus
