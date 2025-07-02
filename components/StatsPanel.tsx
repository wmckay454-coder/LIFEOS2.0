"use client"
import { useState, useEffect } from "react"
import type { Stats, FloatingXP, JournalEntry, CheckInData, Habit } from "@/lib/types"
import { statDescriptions } from "@/lib/constants"
import { SmartRecommendationEngine, type StatInsight } from "@/lib/ai/smart-recommendations"

interface StatsPanelProps {
  stats: Stats
  handleXPAdd: (stat: keyof Stats, baseXP: number) => void
  floatingXP: FloatingXP[]
  journalEntries: JournalEntry[]
  checkIns: CheckInData[]
  habits: Habit[]
}

export default function StatsPanel({
  stats,
  handleXPAdd,
  floatingXP,
  journalEntries,
  checkIns,
  habits,
}: StatsPanelProps) {
  const [insights, setInsights] = useState<StatInsight[]>([])
  const [selectedInsight, setSelectedInsight] = useState<StatInsight | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const getStatLevel = (value: number) => Math.floor(value / 100) + 1
  const getStatProgress = (value: number) => value % 100

  const statColors = {
    MIND: "from-blue-500 to-cyan-500",
    BODY: "from-green-500 to-emerald-500",
    SPIRIT: "from-purple-500 to-violet-500",
    WORK: "from-orange-500 to-red-500",
    PLAY: "from-pink-500 to-rose-500",
  }

  const statIcons = {
    MIND: "🧠",
    BODY: "💪",
    SPIRIT: "🧘",
    WORK: "⚡",
    PLAY: "🎮",
  }

  useEffect(() => {
    analyzeStats()
  }, [stats, habits, journalEntries, checkIns])

  const analyzeStats = async () => {
    setIsAnalyzing(true)

    try {
      const statInsights = SmartRecommendationEngine.analyzeStats(stats, habits, journalEntries, checkIns)
      setInsights(statInsights)
    } catch (error) {
      console.error("Failed to analyze stats:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getPriorityColor = (priority: StatInsight["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-900/30 border-red-800/50"
      case "medium":
        return "text-yellow-400 bg-yellow-900/30 border-yellow-800/50"
      case "low":
        return "text-green-400 bg-green-900/30 border-green-800/50"
    }
  }

  const getStatusIcon = (status: StatInsight["status"]) => {
    switch (status) {
      case "lagging":
        return "⚠️"
      case "balanced":
        return "✅"
      case "excelling":
        return "🚀"
    }
  }

  const handleStatClick = (statKey: keyof Stats) => {
    handleXPAdd(statKey, 10)

    // Show relevant insight if available
    const relevantInsight = insights.find((insight) => insight.stat === statKey)
    if (relevantInsight) {
      setSelectedInsight(relevantInsight)
      setShowInsights(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Smart Character Stats</h2>
          <p className="text-gray-400 text-sm">Click to gain XP • AI analyzes your progress</p>
        </div>
        <button
          onClick={() => setShowInsights(!showInsights)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {isAnalyzing ? "Analyzing..." : "View Insights"}
        </button>
      </div>

      {/* Smart Insights Panel */}
      {showInsights && insights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-2xl border border-indigo-800/50 mb-6">
          <h3 className="text-indigo-300 font-semibold mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 4).map((insight) => (
              <div
                key={insight.stat}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-105 ${getPriorityColor(insight.priority)}`}
                onClick={() => setSelectedInsight(selectedInsight?.stat === insight.stat ? null : insight)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{statIcons[insight.stat]}</span>
                    <span className="font-medium">{insight.stat}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">{getStatusIcon(insight.status)}</span>
                    <span className="text-xs capitalize">{insight.priority}</span>
                  </div>
                </div>
                <p className="text-sm opacity-90">{insight.recommendation}</p>

                {selectedInsight?.stat === insight.stat && (
                  <div className="mt-3 pt-3 border-t border-current/20">
                    <h4 className="text-sm font-medium mb-2">Suggested Actions:</h4>
                    <ul className="space-y-1">
                      {insight.suggestedActions.map((action, index) => (
                        <li key={index} className="text-xs flex items-start">
                          <span className="mr-2">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
        {Object.entries(stats).map(([stat, value]) => {
          const level = getStatLevel(value)
          const progress = getStatProgress(value)
          const statKey = stat as keyof Stats
          const relevantInsight = insights.find((insight) => insight.stat === statKey)

          return (
            <div
              key={stat}
              onClick={() => handleStatClick(statKey)}
              className="relative bg-black/40 border border-gray-700 p-6 rounded-2xl cursor-pointer group hover:border-indigo-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20"
            >
              {/* Floating XP Animation */}
              {floatingXP
                .filter((f) => f.stat === stat)
                .map((f) => (
                  <div
                    key={f.id}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[fadeUp_1s_ease-out] text-green-400 text-lg font-bold pointer-events-none z-10"
                  >
                    +10 XP
                  </div>
                ))}

              {/* Insight Indicator */}
              {relevantInsight && (
                <div
                  className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    relevantInsight.priority === "high"
                      ? "bg-red-500"
                      : relevantInsight.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  title={`${relevantInsight.priority} priority insight available`}
                />
              )}

              {/* Stat Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{statIcons[statKey]}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{stat}</h3>
                    <p className="text-xs text-gray-400">Level {level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-indigo-400 font-semibold">{value} XP</p>
                  <p className="text-xs text-gray-500">{100 - progress} to next</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 h-3 rounded-full mb-3 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${statColors[statKey]} transition-all duration-500 ease-out relative`}
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors mb-2">
                {statDescriptions[statKey]}
              </p>

              {/* Smart Recommendation Preview */}
              {relevantInsight && (
                <div className="mt-2 p-2 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <span className="text-xs mr-1">{getStatusIcon(relevantInsight.status)}</span>
                    <span className="text-xs text-indigo-400 font-medium">Smart Tip:</span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">{relevantInsight.suggestedActions[0]}</p>
                </div>
              )}

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          )
        })}
      </div>

      {/* Recent Wins with Smart Analysis */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4 rounded-xl border border-green-800/50">
        <h3 className="text-green-300 font-semibold mb-2 flex items-center">
          <span className="mr-2">🏆</span>
          Progress Analysis
        </h3>
        <div className="space-y-1 text-sm">
          {insights.filter((i) => i.status === "excelling").length > 0 && (
            <p className="text-gray-300">• {insights.filter((i) => i.status === "excelling").length} stats excelling</p>
          )}
          {insights.filter((i) => i.priority === "high").length > 0 && (
            <p className="text-yellow-300">
              • {insights.filter((i) => i.priority === "high").length} areas need attention
            </p>
          )}
          <p className="text-gray-300">• Balanced growth across {Object.keys(stats).length} life areas</p>
          <p className="text-gray-300">• Total XP: {Object.values(stats).reduce((a, b) => a + b, 0)}</p>
        </div>
      </div>
    </div>
  )
}
