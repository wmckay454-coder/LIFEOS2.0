"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Calendar, Heart, Zap, Target, X } from "lucide-react"
import type { CheckInData } from "@/lib/types"

interface DailyCheckInProps {
  onCheckIn: (mood: number, energy: number, emoji?: string, notes?: string) => void
  recentCheckIns: CheckInData[]
  onXPGain: (stat: string, amount: number) => void
  onSkip?: () => void
}

export default function DailyCheckIn({ onCheckIn, recentCheckIns, onXPGain, onSkip }: DailyCheckInProps) {
  const [mood, setMood] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user has already checked in today
  const today = new Date().toDateString()
  const hasCheckedInToday = recentCheckIns.some((checkIn) => {
    const checkInDate = new Date(checkIn.date).toDateString()
    return checkInDate === today
  })

  const getMoodEmoji = (moodValue: number) => {
    const emojis = ["😢", "😔", "😕", "😐", "🙂", "😊", "😄", "🤩", "🌟", "🚀"]
    return emojis[Math.max(0, Math.min(9, moodValue - 1))]
  }

  const getEnergyColor = (energyValue: number) => {
    if (energyValue <= 3) return "from-red-500 to-orange-500"
    if (energyValue <= 6) return "from-yellow-500 to-orange-500"
    return "from-green-500 to-emerald-500"
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate submission delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const emoji = getMoodEmoji(mood)
    onCheckIn(mood, energy, emoji, notes)
    onXPGain("SPIRIT", 15)

    setIsSubmitting(false)
  }

  const handleSkip = () => {
    // Mark today as skipped by creating a minimal check-in entry
    const emoji = "⏭️"
    onCheckIn(0, 0, emoji, "Skipped today")
    if (onSkip) onSkip()
  }

  // If already checked in today, show completion state
  if (hasCheckedInToday) {
    const todaysCheckIn = recentCheckIns.find((checkIn) => {
      const checkInDate = new Date(checkIn.date).toDateString()
      return checkInDate === today
    })

    const isSkipped = todaysCheckIn?.mood === 0 && todaysCheckIn?.energy === 0

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/20 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
              {isSkipped ? (
                <Clock className="w-10 h-10 text-white" />
              ) : (
                <CheckCircle className="w-10 h-10 text-white" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              {isSkipped ? "Check-in Skipped" : "Check-in Complete!"}
            </h2>

            {!isSkipped && todaysCheckIn && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-center space-x-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{todaysCheckIn.emoji}</div>
                    <p className="text-green-300 text-sm">Mood: {todaysCheckIn.mood}/10</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl mb-2">⚡</div>
                    <p className="text-green-300 text-sm">Energy: {todaysCheckIn.energy}/10</p>
                  </div>
                </div>

                {todaysCheckIn.notes && todaysCheckIn.notes !== "Skipped today" && (
                  <div className="bg-black/20 rounded-xl p-4">
                    <p className="text-gray-300 text-sm italic">"{todaysCheckIn.notes}"</p>
                  </div>
                )}
              </div>
            )}

            <Badge variant="secondary" className="bg-green-500/20 text-green-300 mb-4">
              {isSkipped ? "See you tomorrow!" : "+15 SPIRIT XP earned"}
            </Badge>

            <p className="text-gray-400 text-sm">
              {isSkipped
                ? "You can check in again tomorrow. Take care of yourself!"
                : "Great job taking care of your mental health! Come back tomorrow for your next check-in."}
            </p>

            <div className="mt-6 flex items-center justify-center text-purple-300 text-sm">
              <Calendar className="w-4 h-4 mr-2" />
              Next check-in available tomorrow
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardContent className="p-8">
          {!isSubmitting ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Daily Check-In</h2>
                <p className="text-gray-400">Take a moment to reflect on your day</p>
              </div>

              <div className="space-y-8">
                {/* Mood Slider */}
                <div>
                  <label className="block text-white font-semibold mb-4 text-lg">
                    How are you feeling today? ({mood}/10)
                  </label>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="text-2xl">😢</span>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={mood}
                        onChange={(e) => setMood(Number(e.target.value))}
                        className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${mood * 10}%, #374151 ${mood * 10}%, #374151 100%)`,
                        }}
                      />
                    </div>
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div className="text-center">
                    <span className="text-6xl">{getMoodEmoji(mood)}</span>
                  </div>
                </div>

                {/* Energy Slider */}
                <div>
                  <label className="block text-white font-semibold mb-4 text-lg">
                    What's your energy level? ({energy}/10)
                  </label>
                  <div className="flex items-center space-x-4 mb-4">
                    <Zap className="w-6 h-6 text-gray-400" />
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={energy}
                        onChange={(e) => setEnergy(Number(e.target.value))}
                        className="w-full h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${energy * 10}%, #374151 ${energy * 10}%, #374151 100%)`,
                        }}
                      />
                    </div>
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-center">
                    <Badge
                      variant="secondary"
                      className={`bg-gradient-to-r ${getEnergyColor(energy)} text-white px-4 py-2`}
                    >
                      {energy <= 3 ? "Low Energy" : energy <= 6 ? "Moderate Energy" : "High Energy"}
                    </Badge>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-white font-semibold mb-4 text-lg">
                    Any thoughts or notes? (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How was your day? What's on your mind?"
                    className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-gray-500 text-xs mt-1">{notes.length}/200 characters</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white h-12"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Skip Today
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12 shadow-lg shadow-purple-500/25"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Check-In
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Submission Loading State */
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg shadow-purple-500/25">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Saving Your Check-In...</h3>
              <p className="text-gray-400">Thank you for taking care of yourself today!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
