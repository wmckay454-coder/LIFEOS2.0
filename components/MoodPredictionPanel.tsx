"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, AlertTriangle, CheckCircle, Calendar, Brain, Target, Clock, Heart, Activity } from "lucide-react"
import {
  MoodPredictionEngine,
  type MoodPattern,
  type MoodPrediction,
  type PreventativeAction,
} from "@/lib/ai/mood-prediction"
import type { CheckInData, JournalEntry, Habit, Stats } from "@/lib/types"

interface MoodPredictionPanelProps {
  checkIns: CheckInData[]
  journalEntries: JournalEntry[]
  habits: Habit[]
  stats: Stats
}

export default function MoodPredictionPanel({ checkIns, journalEntries, habits, stats }: MoodPredictionPanelProps) {
  const [patterns, setPatterns] = useState<MoodPattern[]>([])
  const [predictions, setPredictions] = useState<MoodPrediction[]>([])
  const [preventativeActions, setPreventativeActions] = useState<PreventativeAction[]>([])
  const [selectedAction, setSelectedAction] = useState<PreventativeAction | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    analyzeMoodData()
  }, [checkIns, journalEntries])

  const analyzeMoodData = async () => {
    setIsAnalyzing(true)

    try {
      // Analyze patterns
      const detectedPatterns = MoodPredictionEngine.analyzeMoodPatterns(checkIns, journalEntries)
      setPatterns(detectedPatterns)

      // Generate predictions for next 7 days
      const futurePredictions: MoodPrediction[] = []
      for (let i = 1; i <= 7; i++) {
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + i)

        const prediction = MoodPredictionEngine.predictMood(checkIns, detectedPatterns, targetDate)
        futurePredictions.push(prediction)
      }
      setPredictions(futurePredictions)

      // Generate preventative actions
      const actions = MoodPredictionEngine.generatePreventativeActions(detectedPatterns, futurePredictions)
      setPreventativeActions(actions)
    } catch (error) {
      console.error("Error analyzing mood data:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getMoodEmoji = (mood: number) => {
    if (mood <= 2) return "😢"
    if (mood <= 4) return "😔"
    if (mood <= 6) return "😐"
    if (mood <= 8) return "🙂"
    return "😊"
  }

  const getRiskColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
    }
  }

  const getPatternIcon = (type: MoodPattern["type"]) => {
    switch (type) {
      case "daily":
        return <Clock className="w-4 h-4" />
      case "weekly":
        return <Calendar className="w-4 h-4" />
      case "seasonal":
        return <Activity className="w-4 h-4" />
      case "trigger-based":
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: PreventativeAction["category"]) => {
    switch (category) {
      case "physical":
        return <Activity className="w-4 h-4" />
      case "mental":
        return <Brain className="w-4 h-4" />
      case "social":
        return <Heart className="w-4 h-4" />
      case "spiritual":
        return <Target className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty: PreventativeAction["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/20 text-green-400"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400"
      case "hard":
        return "bg-red-500/20 text-red-400"
    }
  }

  if (checkIns.length < 3) {
    return (
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardContent className="p-8 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h3 className="text-xl font-semibold text-white mb-2">Mood AI Learning</h3>
          <p className="text-gray-400 mb-4">
            Complete at least 3 check-ins to unlock mood pattern analysis and predictions.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-full max-w-xs bg-gray-800 h-2 rounded-full">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(checkIns.length / 3) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">{checkIns.length}/3</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/20 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Mood AI</h1>
                <p className="text-purple-300">Predictive mood analysis & prevention</p>
              </div>
            </div>
            <Button onClick={analyzeMoodData} disabled={isAnalyzing} className="bg-purple-600 hover:bg-purple-700">
              {isAnalyzing ? "Analyzing..." : "Refresh Analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-black/20 backdrop-blur-xl border border-white/10">
          <TabsTrigger value="predictions" className="data-[state=active]:bg-purple-600">
            Predictions
          </TabsTrigger>
          <TabsTrigger value="patterns" className="data-[state=active]:bg-purple-600">
            Patterns
          </TabsTrigger>
          <TabsTrigger value="actions" className="data-[state=active]:bg-purple-600">
            Prevention
          </TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4">
            {predictions.map((prediction, index) => {
              const date = new Date(prediction.date)
              const dayName = date.toLocaleDateString("en-US", { weekday: "long" })
              const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

              return (
                <Card key={index} className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{getMoodEmoji(prediction.predictedMood)}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{dayName}</h3>
                          <p className="text-gray-400 text-sm">{dateStr}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{prediction.predictedMood}/10</div>
                        <Badge className={getRiskColor(prediction.riskLevel)}>{prediction.riskLevel} risk</Badge>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Confidence</span>
                        <span className="text-sm text-white">{(prediction.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={prediction.confidence * 100} className="h-2" />
                    </div>

                    {prediction.factors.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-white mb-2">Contributing Factors:</h4>
                        <div className="space-y-1">
                          {prediction.factors.map((factor, i) => (
                            <div key={i} className="flex items-center text-sm text-gray-300">
                              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                              {factor}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {prediction.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-white mb-2">Recommendations:</h4>
                        <div className="space-y-1">
                          {prediction.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-center text-sm text-green-300">
                              <CheckCircle className="w-3 h-3 mr-2" />
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          {patterns.length === 0 ? (
            <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-white mb-2">No Patterns Detected</h3>
                <p className="text-gray-400">Continue tracking your mood to discover patterns and insights.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {patterns.map((pattern) => (
                <Card key={pattern.id} className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                          {getPatternIcon(pattern.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{pattern.pattern}</h3>
                          <p className="text-gray-400 text-sm capitalize">{pattern.type} pattern</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                        {(pattern.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>

                    <p className="text-gray-300 text-sm mb-4">{pattern.description}</p>

                    {pattern.timeframe && (
                      <div className="flex items-center text-sm text-purple-300 mb-2">
                        <Clock className="w-4 h-4 mr-2" />
                        {pattern.timeframe}
                      </div>
                    )}

                    {pattern.triggers && pattern.triggers.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-white mb-2">Potential Triggers:</h4>
                        <div className="flex flex-wrap gap-2">
                          {pattern.triggers.map((trigger, i) => (
                            <Badge key={i} variant="secondary" className="bg-red-500/20 text-red-300">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Prevention Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4">
            {preventativeActions.map((action) => (
              <Card
                key={action.id}
                className={`bg-black/20 backdrop-blur-xl border-white/10 shadow-xl cursor-pointer transition-all hover:scale-[1.02] ${
                  selectedAction?.id === action.id ? "ring-2 ring-purple-500" : ""
                }`}
                onClick={() => setSelectedAction(selectedAction?.id === action.id ? null : action)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                        {getCategoryIcon(action.category)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{action.title}</h3>
                        <p className="text-gray-400 text-sm capitalize">
                          {action.type} • {action.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyColor(action.difficulty)}>{action.difficulty}</Badge>
                      <div className="text-right">
                        <div className="text-sm text-white font-medium">{(action.effectiveness * 100).toFixed(0)}%</div>
                        <div className="text-xs text-gray-400">effective</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4">{action.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-400">
                        Effectiveness: {(action.effectiveness * 100).toFixed(0)}%
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Implementation for starting action
                        console.log("Starting action:", action.title)
                      }}
                    >
                      Start Action
                    </Button>
                  </div>

                  {selectedAction?.id === action.id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-sm font-medium text-white mb-2">Implementation Tips:</h4>
                      <div className="space-y-2 text-sm text-gray-300">
                        {action.type === "daily" && <p>• Set a daily reminder at a consistent time</p>}
                        {action.type === "weekly" && <p>• Schedule this activity for the same day each week</p>}
                        {action.difficulty === "easy" && <p>• Start with just 5-10 minutes to build the habit</p>}
                        {action.difficulty === "hard" && <p>• Break this down into smaller, manageable steps</p>}
                        <p>• Track your progress to see the impact on your mood</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
