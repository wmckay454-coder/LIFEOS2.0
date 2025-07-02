"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DataManager as DM, STORAGE_KEYS, DATA_VERSION } from "@/lib/utils/dataManager"
import {
  Download,
  Upload,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  FileText,
  Lock,
} from "lucide-react"

export default function DataManager() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [dataSize, setDataSize] = useState(0)
  const [backupCount, setBackupCount] = useState(0)
  const [migrationHistory, setMigrationHistory] = useState<string[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadDataInfo()
  }, [])

  const loadDataInfo = async () => {
    try {
      const data = await DM.loadCompleteData()
      setDataSize(data.metadata.dataSize)
      setBackupCount(data.metadata.backupCount)
      setMigrationHistory(data.metadata.migrationHistory)

      const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
      setLastBackup(lastSync)

      const incidentData = JSON.parse(localStorage.getItem("lifeOS_incidents") || "[]")
      setIncidents(incidentData)
    } catch (error) {
      console.error("Failed to load data info:", error)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const data = await DM.exportUserData(exportFormat)
      const blob = new Blob([data], {
        type: exportFormat === "json" ? "application/json" : "text/csv",
      })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `life-os-backup-${new Date().toISOString().split("T")[0]}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "Data exported successfully!" })
    } catch (error) {
      setMessage({ type: "error", text: "Export failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const text = await file.text()
      const format = file.name.endsWith(".csv") ? "csv" : "json"
      const result = await DM.importUserData(text, format)

      if (result.success) {
        setMessage({ type: "success", text: result.message })
        await loadDataInfo()
        // Reload page to reflect imported data
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Import failed. Please check your file format." })
    } finally {
      setIsLoading(false)
      event.target.value = ""
    }
  }

  const handleCreateBackup = async () => {
    setIsLoading(true)
    try {
      await DM.createAutomaticBackup()
      await loadDataInfo()
      setMessage({ type: "success", text: "Backup created successfully!" })
    } catch (error) {
      setMessage({ type: "error", text: "Backup creation failed." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      // Create final backup before clearing
      await DM.createAutomaticBackup()

      // Clear all data
      Object.values(STORAGE_KEYS).forEach((key) => {
        if (typeof key === "string") {
          localStorage.removeItem(key)
        }
      })

      setMessage({ type: "success", text: "All data cleared. Page will reload." })
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to clear data." })
    } finally {
      setIsLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Database className="w-6 h-6 mr-3" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${message.type === "success" ? "border-green-500" : "border-red-500"}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-white">{message.text}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="overview" className="text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="backup" className="text-white">
                Backup
              </TabsTrigger>
              <TabsTrigger value="security" className="text-white">
                Security
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="text-white">
                Maintenance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Data Version</p>
                        <p className="text-lg font-semibold text-white">{DATA_VERSION}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        Current
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Data Size</p>
                        <p className="text-lg font-semibold text-white">{formatBytes(dataSize)}</p>
                      </div>
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Backups</p>
                        <p className="text-lg font-semibold text-white">{backupCount}</p>
                      </div>
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Migration History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {migrationHistory.map((version, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-white">{version}</span>
                        <Badge variant="outline" className="text-gray-300">
                          {index === migrationHistory.length - 1 ? "Current" : "Migrated"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Export Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-white">Format:</label>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as "json" | "csv")}
                        className="bg-white/10 text-white border border-white/20 rounded px-2 py-1"
                      >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                      </select>
                    </div>
                    <Button
                      onClick={handleExport}
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isLoading ? "Exporting..." : "Export Data"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Import Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Import previously exported data. This will replace all current data.
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json,.csv"
                        onChange={handleImport}
                        disabled={isLoading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
                        <Upload className="w-4 h-4 mr-2" />
                        {isLoading ? "Importing..." : "Import Data"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Automatic Backups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Last Backup</p>
                      <p className="text-sm text-gray-400">{lastBackup ? formatDate(lastBackup) : "Never"}</p>
                    </div>
                    <Button
                      onClick={handleCreateBackup}
                      disabled={isLoading}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Create Backup
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Backup Frequency</span>
                      <span className="text-white">Every hour</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Retention</span>
                      <span className="text-white">7 backups</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center">
                    <Lock className="w-5 h-5 mr-2" />
                    Data Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white">Encryption</span>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Enabled
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">All data is encrypted before storage</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white">Local Storage</span>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          <Shield className="w-3 h-3 mr-1" />
                          Secure
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">Data never leaves your device</p>
                    </div>
                  </div>

                  {incidents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">Security Incidents</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {incidents.map((incident, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded text-sm">
                            <span className="text-gray-300">{incident.type}</span>
                            <span className="text-gray-400">{formatDate(incident.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Data Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded">
                      <div>
                        <h4 className="text-white font-medium">Storage Usage</h4>
                        <p className="text-sm text-gray-400">{formatBytes(dataSize)} of local storage used</p>
                      </div>
                      <Progress value={Math.min((dataSize / (5 * 1024 * 1024)) * 100, 100)} className="w-24" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded">
                      <div>
                        <h4 className="text-white font-medium">Auto-Save</h4>
                        <p className="text-sm text-gray-400">Automatically saves every 30 seconds</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <Button
                        onClick={handleClearData}
                        disabled={isLoading}
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Data
                      </Button>
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        This action cannot be undone. A backup will be created first.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
