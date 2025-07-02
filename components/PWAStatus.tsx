"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PWAManager } from "@/lib/utils/pwa-manager"
import { DeviceIntegration } from "@/lib/utils/device-integration"
import { Wifi, WifiOff, Bell, Camera, MapPin, Smartphone, Battery, Share2, HardDrive } from "lucide-react"

export default function PWAStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isInstalled, setIsInstalled] = useState(false)
  const [capabilities, setCapabilities] = useState<any>({})
  const [batteryInfo, setBatteryInfo] = useState<any>(null)
  const [networkInfo, setNetworkInfo] = useState<any>(null)
  const [storageInfo, setStorageInfo] = useState<any>(null)

  const pwaManager = PWAManager.getInstance()
  const deviceIntegration = DeviceIntegration.getInstance()

  useEffect(() => {
    initializePWAStatus()
    setupEventListeners()
  }, [])

  const initializePWAStatus = async () => {
    // Check if app is installed
    setIsInstalled(pwaManager.isInstalled())

    // Get device capabilities
    setCapabilities(deviceIntegration.getDeviceCapabilities())

    // Get battery info
    const battery = await deviceIntegration.getBatteryInfo()
    setBatteryInfo(battery)

    // Get network info
    setNetworkInfo(deviceIntegration.getNetworkInfo())

    // Get storage info
    const storage = await pwaManager.getStorageEstimate()
    setStorageInfo(storage)
  }

  const setupEventListeners = () => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }

  const handleTestCamera = async () => {
    const photo = await deviceIntegration.capturePhoto()
    if (photo) {
      alert("Camera test successful!")
    } else {
      alert("Camera test failed")
    }
  }

  const handleTestLocation = async () => {
    const location = await deviceIntegration.getCurrentLocation()
    if (location) {
      alert(`Location: ${location.coords.latitude}, ${location.coords.longitude}`)
    } else {
      alert("Location test failed")
    }
  }

  const handleTestShare = async () => {
    const success = await deviceIntegration.shareContent({
      title: "Life OS",
      text: "Check out my personal growth progress!",
      url: window.location.href,
    })

    if (success) {
      alert("Share test successful!")
    } else {
      alert("Share test failed")
    }
  }

  const handleTestVibration = () => {
    const success = deviceIntegration.vibrate([100, 50, 100])
    if (success) {
      alert("Vibration test successful!")
    } else {
      alert("Vibration not supported")
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            {isOnline ? (
              <Wifi className="w-5 h-5 mr-2 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 mr-2 text-red-400" />
            )}
            Connection Status
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Status</span>
                <Badge variant={isOnline ? "default" : "destructive"}>{isOnline ? "Online" : "Offline"}</Badge>
              </div>

              {networkInfo && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Connection Type</span>
                    <span className="text-white">{networkInfo.effectiveType || "Unknown"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Downlink</span>
                    <span className="text-white">{networkInfo.downlink || "Unknown"} Mbps</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">App Status</span>
                <Badge variant={isInstalled ? "default" : "secondary"}>{isInstalled ? "Installed" : "Browser"}</Badge>
              </div>

              {batteryInfo && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Battery</span>
                    <div className="flex items-center">
                      <Battery className="w-4 h-4 mr-1 text-gray-400" />
                      <span className="text-white">{Math.round(batteryInfo.level * 100)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Charging</span>
                    <span className="text-white">{batteryInfo.charging ? "Yes" : "No"}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Capabilities */}
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Device Capabilities
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Camera className={`w-8 h-8 mx-auto mb-2 ${capabilities.camera ? "text-green-400" : "text-gray-600"}`} />
              <p className="text-sm text-gray-300">Camera</p>
              <Badge variant={capabilities.camera ? "default" : "secondary"} className="mt-1">
                {capabilities.camera ? "Available" : "Not Available"}
              </Badge>
              {capabilities.camera && (
                <Button size="sm" variant="outline" onClick={handleTestCamera} className="mt-2 w-full bg-transparent">
                  Test
                </Button>
              )}
            </div>

            <div className="text-center">
              <MapPin
                className={`w-8 h-8 mx-auto mb-2 ${capabilities.geolocation ? "text-green-400" : "text-gray-600"}`}
              />
              <p className="text-sm text-gray-300">Location</p>
              <Badge variant={capabilities.geolocation ? "default" : "secondary"} className="mt-1">
                {capabilities.geolocation ? "Available" : "Not Available"}
              </Badge>
              {capabilities.geolocation && (
                <Button size="sm" variant="outline" onClick={handleTestLocation} className="mt-2 w-full bg-transparent">
                  Test
                </Button>
              )}
            </div>

            <div className="text-center">
              <Bell className={`w-8 h-8 mx-auto mb-2 ${capabilities.vibration ? "text-green-400" : "text-gray-600"}`} />
              <p className="text-sm text-gray-300">Vibration</p>
              <Badge variant={capabilities.vibration ? "default" : "secondary"} className="mt-1">
                {capabilities.vibration ? "Available" : "Not Available"}
              </Badge>
              {capabilities.vibration && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestVibration}
                  className="mt-2 w-full bg-transparent"
                >
                  Test
                </Button>
              )}
            </div>

            <div className="text-center">
              <Share2 className={`w-8 h-8 mx-auto mb-2 ${capabilities.share ? "text-green-400" : "text-gray-600"}`} />
              <p className="text-sm text-gray-300">Share</p>
              <Badge variant={capabilities.share ? "default" : "secondary"} className="mt-1">
                {capabilities.share ? "Available" : "Not Available"}
              </Badge>
              {capabilities.share && (
                <Button size="sm" variant="outline" onClick={handleTestShare} className="mt-2 w-full bg-transparent">
                  Test
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Information */}
      {storageInfo && (
        <Card className="bg-black/20 backdrop-blur-xl border-white/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <HardDrive className="w-5 h-5 mr-2" />
              Storage Information
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Used Storage</span>
                <span className="text-white">{formatBytes(storageInfo.usage || 0)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Available Storage</span>
                <span className="text-white">{formatBytes(storageInfo.quota || 0)}</span>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${storageInfo.quota ? (storageInfo.usage / storageInfo.quota) * 100 : 0}%`,
                  }}
                />
              </div>

              <p className="text-xs text-gray-400">
                {storageInfo.quota
                  ? `${((storageInfo.usage / storageInfo.quota) * 100).toFixed(1)}% used`
                  : "Storage info unavailable"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PWA Actions */}
      <Card className="bg-black/20 backdrop-blur-xl border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">PWA Actions</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => pwaManager.triggerBackgroundSync()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Sync Data
            </Button>

            <Button
              onClick={() => pwaManager.requestPersistentStorage()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Request Persistent Storage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
