"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motivationalQuotes } from "@/lib/constants"
import type { Stats, Mission } from "@/lib/types"
import {
  TrendingUp,
  Target,
  Zap,
  Star,
  CheckCircle,
  Calendar,
  Brain,
  Heart,
  Dumbbell,
  Briefcase,
  Gamepad2,
} from "lucide-react"

interface HomePanelProps {
  stats: Stats
  onQuickCheckIn: (mood: number, energy: number, emoji?: string) => void
  todaysMission: Mission | null
  onCompleteMission: (missionId: string) => void
  level: number
  totalXP: number
  recentMood: number
  recentEnergy: number
}

const statIcons = {
  MIND: Brain,
  BODY: Dumbbell,
  SPIRIT: Heart,
  WORK: Briefcase,
  PLAY: Gamepad2,
}

const moodEmojis = ["😢", "😔", "😐", "🙂", "😊", "😄", "🤩"]
const energyEmojis = ["😴", "😪", "😐", "🙂", "😊", "⚡", "🔥"]

export default function HomePanel({
  stats,
  onQuickCheckIn,
  todaysMission,
  onCompleteMission,
  level,
  totalXP,
  recentMood,
  recentEnergy,
}: HomePanelProps) {
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0])
  const [quickMood, setQuickMood] = useState(5)
  const [quickEnergy, setQuickEnergy] = useState(5)

  useEffect(() => {
    // Rotate quotes every 30 seconds
    const interval = setInterval(() => {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
      setCurrentQuote(randomQuote)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleQuickCheckIn = () => {
    onQuickCheckIn(quickMood, quickEnergy, moodEmojis[quickMood - 1])
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  const getTopStat = () => {
    const entries = Object.entries(stats) as [keyof Stats, number][]
    return entries.reduce((a, b) => (a[1] > b[1] ? a : b))
  }

  const [topStatName, topStatValue] = getTopStat()

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">{getGreeting()}!</h1>
        <p className="text-xl text-purple-300">Ready to level up your life?</p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(stats).map(([stat, value]) => {
          const Icon = statIcons[stat as keyof Stats]
          return (
            <Card
              key={stat}
              className="bg-black/20 backdrop-blur-xl border-white/10 hover:border-purple-500/30 transition-all duration-300"
            >
              <CardContent className="p-4 text-center">
                <Icon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <h3 className="text-white font-semibold text-sm">{stat}</h3>
                <p className="text-2xl font-bold text-purple-300">{value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Mission */}
        <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Target className="w-6 h-6 mr-2 text-purple-400" />
                Today's Mission
              </h3>
              {todaysMission && (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                  +{todaysMission.xpReward} XP
                </Badge>
              )}
            </div>

            {todaysMission ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{todaysMission.title}</h4>
                  <p className="text-gray-300 text-sm">{todaysMission.description}</p>
                </div>

                {!todaysMission.completed ? (
                  <Button
                    onClick={() => onCompleteMission(todaysMission.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Mission
                  </Button>
                ) : (
                  <div className="flex items-center justify-center p-4 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                    <span className="text-green-300 font-semibold">Mission Completed!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">No missions available today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Check-in */}
        <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-blue-400" />
              Quick Check-in
            </h3>

            <div className="space-y-4">
              {/* Mood Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  How are you feeling? {moodEmojis[quickMood - 1]}
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={quickMood}
                  onChange={(e) => setQuickMood(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>😢</span>
                  <span>😐</span>
                  <span>🤩</span>
                </div>
              </div>

              {/* Energy Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Energy Level? {energyEmojis[quickEnergy - 1]}
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={quickEnergy}
                  onChange={(e) => setQuickEnergy(Number.parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>😴</span>
                  <span>😐</span>
                  <span>🔥</span>
                </div>
              </div>

              <Button onClick={handleQuickCheckIn} className="w-full bg-blue-600 hover:bg-blue-700">
                <Zap className="w-4 h-4 mr-2" />
                Quick Check-in (+5 XP)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level Progress */}
        <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
              Your Progress
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Current Level</span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  Level {level}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Total XP</span>
                <span className="text-white font-semibold">{totalXP}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Strongest Stat</span>
                <div className="flex items-center">
                  {React.createElement(statIcons[topStatName], { className: "w-4 h-4 mr-1 text-purple-400" })}
                  <span className="text-white font-semibold">
                    {topStatName} ({topStatValue})
                  </span>
                </div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((totalXP % 500) / 500) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                {500 - (totalXP % 500)} XP until Level {level + 1}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Motivational Quote */}
        <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/20 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-400" />
              Daily Inspiration
            </h3>

            <div className="space-y-4">
              <blockquote className="text-lg text-white italic leading-relaxed">"{currentQuote.text}"</blockquote>
              <cite className="text-indigo-300 text-sm block text-right">— {currentQuote.author}</cite>

              {currentQuote.type && (
                <Badge variant="outline" className="border-indigo-400 text-indigo-300">
                  {currentQuote.type || "inspiration"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      {(recentMood > 0 || recentEnergy > 0) && (
        <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-gray-300 text-sm">Last Mood</p>
                <div className="text-2xl">{moodEmojis[recentMood - 1] || "😐"}</div>
              </div>

              <div className="text-center">
                <p className="text-gray-300 text-sm">Last Energy</p>
                <div className="text-2xl">{energyEmojis[recentEnergy - 1] || "😐"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
