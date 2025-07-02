"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Zap,
  Activity,
  BarChart3,
} from "lucide-react"
import { GoalSettingEngine, type SmartGoal, type GoalRecommendation } from "@/lib/ai/goal-setting-engine"
import { ContextualRecommendationEngine, type ContextualRecommendation } from "@/lib/ai/contextual-recommendations"
import { HealthMonitoringService, type HealthAlert, type HealthMetrics } from "@/lib/ai/health-monitoring"

interface SmartDashboardProps {
  stats: any
  habits: any[]
  checkIns: any[]
  journalEntries: any[]
  todos: any[]
  onAddGoal: (goal: SmartGoal) => void
  onDismissAlert: (alertId: string) => void
}

export default function SmartDashboard({
  stats,
  habits,
  checkIns,
  journalEntries,
  todos,
  onAddGoal,
  onDismissAlert,
}: SmartDashboardProps) {
  const [goalRecommendations, setGoalRecommendations] = useState<GoalRecommendation[]>([])
  const [contextualRecs, setContextualRecs] = useState<ContextualRecommendation[]>([])
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([])
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "health" | "recommendations">("overview")

  useEffect(() => {
    // Generate AI recommendations
    const userData = { stats, habits, checkIns, journalEntries, todos }

    // Goal recommendations
    const goalRecs = GoalSettingEngine.analyzeUserData(userData)
    setGoalRecommendations(goalRecs)

    // Contextual recommendations
    const now = new Date()
    const hour = now.getHours()
    let timeOfDay: "morning" | "afternoon" | "evening" | "night"

    if (hour < 12) timeOfDay = "morning"
    else if (hour < 17) timeOfDay = "afternoon"
    else if (hour < 21) timeOfDay = "evening"
    else timeOfDay = "night"

    const recentMood = checkIns.length > 0 ? checkIns[checkIns.length - 1].mood : undefined
    const recentEnergy = checkIns.length > 0 ? checkIns[checkIns.length - 1].energy : undefined

    const contextRecs = ContextualRecommendationEngine.generateRecommendations({
      timeOfDay,
      mood: recentMood,
      energy: recentEnergy,
      recentActivities: [],
      userPreferences: {},
      currentGoals: [],
    })
    setContextualRecs(contextRecs)

    // Health monitoring
    const alerts = HealthMonitoringService.analyzeHealthPatterns(userData)
    setHealthAlerts(alerts)

    const metrics = HealthMonitoringService.calculateHealthMetrics(userData)
    setHealthMetrics(metrics)
  }, [stats, habits, checkIns, journalEntries, todos])

  const handleAcceptGoal = (recommendation: GoalRecommendation) => {
    onAddGoal(recommendation.goal)
    setGoalRecommendations((prev) => prev.filter((r) => r.goal.id !== recommendation.goal.id))
  }

  const handleDismissGoal = (goalId: string) => {
    setGoalRecommendations((prev) => prev.filter((r) => r.goal.id !== goalId))
  }

  const handleDismissHealthAlert = (alertId: string) => {
    onDismissAlert(alertId)
    setHealthAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning! Here's your intelligent overview."
    if (hour < 17) return "Good afternoon! Let's check your progress."
    if (hour < 21) return "Good evening! Time to reflect on your day."
    return "Good night! Here's your daily summary."
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "border-red-500 bg-red-50 dark:bg-red-950/20"
      case "warning":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
      case "info":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
      default:
        return "border-gray-500 bg-gray-50 dark:bg-gray-950/20"
    }
  }

  const tabConfig = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: BarChart3,
      color: "from-blue-500 to-cyan-500",
      count: null,
    },
    {
      id: "goals" as const,
      label: "Goals",
      icon: Target,
      color: "from-purple-500 to-pink-500",
      count: goalRecommendations.length,
    },
    {
      id: "health" as const,
      label: "Health",
      icon: Heart,
      color: "from-red-500 to-orange-500",
      count: healthAlerts.length,
    },
    {
      id: "recommendations" as const,
      label: "Recommendations",
      icon: Brain,
      color: "from-green-500 to-emerald-500",
      count: contextualRecs.length,
    },
  ]

  return (
    <div className="p-4 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Smart Dashboard
          </h1>
        </div>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">{getTimeOfDayGreeting()}</p>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="flex flex-wrap gap-4 justify-center p-2">
        {tabConfig.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative h-16 px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105
                ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-2xl shadow-purple-500/25`
                    : "bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
                }
              `}
            >
              <div className="flex flex-col items-center gap-2 min-w-[80px]">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                  {tab.count !== null && tab.count > 0 && (
                    <Badge
                      className={`
                        text-xs px-2 py-1 rounded-full font-bold
                        ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        }
                      `}
                    >
                      {tab.count}
                    </Badge>
                  )}
                </div>
                <span className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-300"}`}>{tab.label}</span>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg" />
              )}
            </Button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Health Metrics */}
            {healthMetrics && (
              <>
                <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                      <Heart className="w-5 h-5" />
                      Stress Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-3">{healthMetrics.stressLevel.toFixed(1)}/10</div>
                    <Progress value={healthMetrics.stressLevel * 10} className="h-3 bg-red-900/30" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-yellow-400">
                      <Zap className="w-5 h-5" />
                      Energy Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-3">{healthMetrics.sleepQuality.toFixed(1)}/10</div>
                    <Progress value={healthMetrics.sleepQuality * 10} className="h-3 bg-yellow-900/30" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-400">
                      <Activity className="w-5 h-5" />
                      Activity Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-3">
                      {healthMetrics.activityLevel.toFixed(1)}/10
                    </div>
                    <Progress value={healthMetrics.activityLevel * 10} className="h-3 bg-green-900/30" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-blue-400">
                      <TrendingUp className="w-5 h-5" />
                      Mood Stability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-3">
                      {healthMetrics.moodStability.toFixed(1)}/10
                    </div>
                    <Progress value={healthMetrics.moodStability * 10} className="h-3 bg-blue-900/30" />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === "goals" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">AI-Generated Goal Recommendations</h2>
          </div>

          {goalRecommendations.length === 0 ? (
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Target className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No New Recommendations</h3>
                <p className="text-gray-400">
                  Keep tracking your progress! New goal suggestions will appear based on your activity.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {goalRecommendations.map((rec) => (
                <Card
                  key={rec.goal.id}
                  className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-l-4 border-l-purple-500 backdrop-blur-sm"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-white mb-2">{rec.goal.title}</CardTitle>
                        <p className="text-gray-300">{rec.goal.description}</p>
                      </div>
                      <Badge className={`${getPriorityColor(rec.goal.priority)} text-white font-semibold px-3 py-1`}>
                        {rec.goal.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-sm text-gray-300">
                          <strong className="text-purple-400">AI Reasoning:</strong> {rec.reasoning}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          <strong>Confidence:</strong> {(rec.confidence * 100).toFixed(0)}%
                        </span>
                        {rec.goal.targetValue && (
                          <span className="text-gray-400">
                            <strong>Target:</strong> {rec.goal.targetValue} {rec.goal.unit}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAcceptGoal(rec)}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                        >
                          Accept Goal
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDismissGoal(rec.goal.id)}
                          className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Health Tab */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Health Insights & Alerts</h2>
          </div>

          {healthAlerts.length === 0 ? (
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">All Systems Good!</h3>
                <p className="text-gray-400">No health alerts at this time. Keep up the great work!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {healthAlerts.map((alert) => (
                <Card key={alert.id} className={`border-2 ${getAlertColor(alert.type)} backdrop-blur-sm`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl flex items-center gap-3 text-white">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                        {alert.title}
                      </CardTitle>
                      <Badge variant="outline" className="border-white/20 text-gray-300">
                        {alert.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4 text-base">{alert.message}</p>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-white">Recommendations:</h4>
                      <ul className="space-y-2">
                        {alert.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDismissHealthAlert(alert.id)}
                      className="mt-4 border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      Dismiss Alert
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Contextual Recommendations</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {contextualRecs.map((rec) => (
              <Card
                key={rec.id}
                className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-white">{rec.title}</CardTitle>
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      {rec.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-3">{rec.description}</p>
                  {rec.duration && (
                    <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {rec.duration} minutes
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {rec.context.map((ctx, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-white/10 text-gray-300">
                        {ctx}
                      </Badge>
                    ))}
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold">
                    Start Activity
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
