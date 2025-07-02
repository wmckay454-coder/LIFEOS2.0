export class DeviceIntegration {
  private static instance: DeviceIntegration

  private constructor() {}

  static getInstance(): DeviceIntegration {
    if (!DeviceIntegration.instance) {
      DeviceIntegration.instance = new DeviceIntegration()
    }
    return DeviceIntegration.instance
  }

  // Camera access for photo journaling
  async capturePhoto(): Promise<string | null> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      const video = document.createElement("video")
      video.srcObject = stream
      video.play()

      return new Promise((resolve) => {
        video.addEventListener("loadedmetadata", () => {
          const canvas = document.createElement("canvas")
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          const ctx = canvas.getContext("2d")
          ctx?.drawImage(video, 0, 0)

          stream.getTracks().forEach((track) => track.stop())

          const dataURL = canvas.toDataURL("image/jpeg", 0.8)
          resolve(dataURL)
        })
      })
    } catch (error) {
      console.error("Camera capture failed:", error)
      return null
    }
  }

  // Geolocation for location-based insights
  async getCurrentLocation(): Promise<GeolocationPosition | null> {
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation not supported")
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          },
        )
      })
    } catch (error) {
      console.error("Geolocation failed:", error)
      return null
    }
  }

  // Device motion for activity tracking
  async requestMotionPermission(): Promise<boolean> {
    try {
      if ("DeviceMotionEvent" in window && typeof (DeviceMotionEvent as any).requestPermission === "function") {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        return permission === "granted"
      }
      return "DeviceMotionEvent" in window
    } catch (error) {
      console.error("Motion permission failed:", error)
      return false
    }
  }

  // Start motion tracking
  startMotionTracking(callback: (data: DeviceMotionEvent) => void): () => void {
    const handleMotion = (event: DeviceMotionEvent) => {
      callback(event)
    }

    window.addEventListener("devicemotion", handleMotion)

    return () => {
      window.removeEventListener("devicemotion", handleMotion)
    }
  }

  // Vibration for feedback
  vibrate(pattern: number | number[]): boolean {
    try {
      if ("vibrate" in navigator) {
        navigator.vibrate(pattern)
        return true
      }
      return false
    } catch (error) {
      console.error("Vibration failed:", error)
      return false
    }
  }

  // Screen wake lock to prevent sleep during activities
  async requestWakeLock(): Promise<WakeLockSentinel | null> {
    try {
      if ("wakeLock" in navigator) {
        const wakeLock = await navigator.wakeLock.request("screen")
        console.log("Wake lock acquired")
        return wakeLock
      }
      return null
    } catch (error) {
      console.error("Wake lock failed:", error)
      return null
    }
  }

  // Battery status for power-aware features
  async getBatteryInfo(): Promise<any> {
    try {
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery()
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        }
      }
      return null
    } catch (error) {
      console.error("Battery info failed:", error)
      return null
    }
  }

  // Network information for adaptive loading
  getNetworkInfo(): any {
    const connection =
      (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      }
    }
    return null
  }

  // Share API for content sharing
  async shareContent(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    try {
      if ("share" in navigator) {
        await navigator.share(data)
        return true
      }

      // Fallback to clipboard
      if (data.text && "clipboard" in navigator) {
        await navigator.clipboard.writeText(data.text)
        return true
      }

      return false
    } catch (error) {
      console.error("Share failed:", error)
      return false
    }
  }

  // Clipboard access
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if ("clipboard" in navigator) {
        await navigator.clipboard.writeText(text)
        return true
      }

      // Fallback method
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand("copy")
      document.body.removeChild(textArea)
      return success
    } catch (error) {
      console.error("Clipboard copy failed:", error)
      return false
    }
  }

  // Read from clipboard
  async readFromClipboard(): Promise<string | null> {
    try {
      if ("clipboard" in navigator) {
        const text = await navigator.clipboard.readText()
        return text
      }
      return null
    } catch (error) {
      console.error("Clipboard read failed:", error)
      return null
    }
  }

  // File system access for data export/import
  async saveFile(data: string, filename: string, type = "application/json"): Promise<boolean> {
    try {
      if ("showSaveFilePicker" in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "JSON files",
              accept: { [type]: [".json"] },
            },
          ],
        })

        const writable = await fileHandle.createWritable()
        await writable.write(data)
        await writable.close()
        return true
      }

      // Fallback to download
      const blob = new Blob([data], { type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error("File save failed:", error)
      return false
    }
  }

  // Open file picker
  async openFile(accept = ".json"): Promise<string | null> {
    try {
      if ("showOpenFilePicker" in window) {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: "JSON files",
              accept: { "application/json": [".json"] },
            },
          ],
        })

        const file = await fileHandle.getFile()
        return await file.text()
      }

      // Fallback to input element
      return new Promise((resolve) => {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = accept
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsText(file)
          } else {
            resolve(null)
          }
        }
        input.click()
      })
    } catch (error) {
      console.error("File open failed:", error)
      return null
    }
  }

  // Check device capabilities
  getDeviceCapabilities(): {
    camera: boolean
    geolocation: boolean
    motion: boolean
    vibration: boolean
    wakeLock: boolean
    battery: boolean
    share: boolean
    clipboard: boolean
    fileSystem: boolean
  } {
    return {
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      geolocation: !!navigator.geolocation,
      motion: "DeviceMotionEvent" in window,
      vibration: "vibrate" in navigator,
      wakeLock: "wakeLock" in navigator,
      battery: "getBattery" in navigator,
      share: "share" in navigator,
      clipboard: "clipboard" in navigator,
      fileSystem: "showOpenFilePicker" in window,
    }
  }
}
