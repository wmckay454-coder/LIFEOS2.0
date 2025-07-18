"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SmartDashboard from "@/components/SmartDashboard"
import NotificationScheduler from "@/components/NotificationScheduler"
import PWAStatus from "@/components/PWAStatus"
import { Bell, Calendar, Settings, Smartphone, Brain, Home, CheckCircle, Clock, Zap } from "lucide-react"
import { dataManager } from "@/lib/utils/dataManager";


export default function HomePage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isOnline, setIsOnline] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)

  
const [stats, setStats] = useState<SyncStatus>({
  lastSync: 0,
  pendingItems: 0,
  isOnline: navigator.onLine,
  isSyncing: false,
});

useEffect(() => {
  dataManager.getSyncStatus().then(setStats);
  // optional: window.addEventListener("online"/"offline", …) to update isOnline
}, []);


  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check for URL parameters to set initial tab
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get("action")

    if (action === "notifications") {
      setActiveTab("notifications")
    } else if (action === "checkin") {
      setActiveTab("dashboard")
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-30" />
      <div className="fixed inset-0 bg-black/20" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 safe-area-inset-top safe-area-inset-bottom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 text-shadow-lg">Life OS</h1>
              <p className="text-gray-300 text-lg">Your Personal Operating System</p>
            </div>
            <div className="flex items-center space-x-3">
              {!isOnline && (
                <Badge variant="secondary" className="bg-red-500/20 text-red-300">
                  Offline Mode
                </Badge>
              )}
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                v2.0.0
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/20 backdrop-blur-xl border border-white/10">
            <TabsTrigger
              value="dashboard"
              className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {notificationCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-red-500 text-white text-xs">
                  {notificationCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="pwa"
              className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              PWA Status
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Features
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <SmartDashboard
  stats={stats}
  onAddGoal={(goal) => {
    /* e.g. dataManager.saveEntry({ type: "goal", title: goal.title, content: goal }) */
  }}
  onDismissAlert={() => {
    /* any “clear notification” logic */
  }}
/>

          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <NotificationScheduler />
          </TabsContent>

          {/* PWA Status Tab */}
          <TabsContent value="pwa" className="mt-6">
            <PWAStatus />
          </TabsContent>

          {/* AI Features Tab */}
          <TabsContent value="ai" className="mt-6">
            <div className="grid gap-6">
              <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Brain className="w-6 h-6 mr-3" />
                    AI-Powered Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center mb-3">
                        <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                        <h3 className="text-white font-semibold">Smart Recommendations</h3>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        AI analyzes your patterns to suggest optimal habits and goals
                      </p>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        Active
                      </Badge>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center mb-3">
                        <Calendar className="w-5 h-5 text-blue-400 mr-2" />
                        <h3 className="text-white font-semibold">Calendar Intelligence</h3>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">Automatic event reminders and schedule optimization</p>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        Active
                      </Badge>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center mb-3">
                        <CheckCircle className="w-5 h-5 text-purple-400 mr-2" />
                        <h3 className="text-white font-semibold">Mood Prediction</h3>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">Predicts mood patterns and suggests interventions</p>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        Active
                      </Badge>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center mb-3">
                        <Clock className="w-5 h-5 text-orange-400 mr-2" />
                        <h3 className="text-white font-semibold">Smart Scheduling</h3>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">Optimizes notification timing based on your behavior</p>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                    <h3 className="text-white font-semibold mb-2">AI Performance</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-400">94%</div>
                        <div className="text-gray-400 text-sm">Accuracy</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-400">1.2s</div>
                        <div className="text-gray-400 text-sm">Response Time</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-400">847</div>
                        <div className="text-gray-400 text-sm">Insights Generated</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions Footer */}
        <div className="fixed bottom-4 left-4 right-4 z-20 md:relative md:bottom-auto md:left-auto md:right-auto md:mt-8">
          <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white text-sm">{isOnline ? "System Online" : "Offline Mode Active"}</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    Quick Reminder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    onClick={() => setActiveTab("pwa")}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
