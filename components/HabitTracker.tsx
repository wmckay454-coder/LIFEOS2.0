'use client'
import React from 'react'
import { Habit } from '@/lib/types'

interface HabitTrackerProps {
  habits: Habit[];
  onCompleteHabit: (habitName: string) => void;
}

export default function HabitTracker({ habits, onCompleteHabit }: HabitTrackerProps) {
  const today = new Date().toDateString()

  const isCompletedToday = (habit: Habit) => {
    return habit.completionHistory.includes(today)
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥'
    if (streak >= 14) return '⚡'
    if (streak >= 7) return '✨'
    if (streak >= 3) return '💫'
    return '🌱'
  }

  return (
    <div className="bg-black/40 border border-indigo-800/50 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <span className="mr-3">🎯</span>
        Daily Habits
      </h2>

      <div className="space-y-3">
        {habits.map((habit) => {
          const completed = isCompletedToday(habit)
          
          return (
            <div
              key={habit.name}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                completed
                  ? 'bg-green-900/30 border-green-700/50'
                  : 'bg-gray-800/50 border-gray-700/50 hover:border-indigo-600/50 cursor-pointer'
              }`}
              onClick={() => !completed && onCompleteHabit(habit.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    completed
                      ? 'bg-green-600 border-green-600'
                      : 'border-gray-600 hover:border-indigo-500'
                  }`}>
                    {completed && <span className="text-white text-sm">✓</span>}
                  </div>
                  <div>
                    <h3 className={`font-medium ${completed ? 'text-green-300' : 'text-white'}`}>
                      {habit.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {habit.streak} day streak {getStreakEmoji(habit.streak)}
                    </p>
                  </div>
                </div>
                
                {completed && (
                  <div className="text-green-400 text-lg">
                    ✅
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Streak Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg border border-orange-800/50">
        <h3 className="text-orange-300 font-semibold mb-2">🔥 Streak Power</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {habits.slice(0, 4).map((habit) => (
            <div key={habit.name} className="flex justify-between">
              <span className="text-gray-300">{habit.name}</span>
              <span className="text-orange-400">{habit.streak}d</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
