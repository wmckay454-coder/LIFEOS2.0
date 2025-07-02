'use client'
import React from 'react'
import { Stats, Habit, Todo, JournalEntry } from '@/lib/types'

interface DashboardOverviewProps {
  stats: Stats;
  habits: Habit[];
  todos: Todo[];
  journalEntries: JournalEntry[];
  level: number;
  totalXP: number;
}

export default function DashboardOverview({ 
  stats, 
  habits, 
  todos, 
  journalEntries, 
  level, 
  totalXP 
}: DashboardOverviewProps) {
  const today = new Date().toDateString()
  const completedHabitsToday = habits.filter(h => h.completionHistory.includes(today)).length
  const completedTodosToday = todos.filter(t => t.completed).length
  const activeTodos = todos.filter(t => !t.completed).length
  const xpToNext = 500 - (totalXP % 500)
  const progressPercent = ((totalXP % 500) / 500) * 100

  const getTopStat = () => {
    const sortedStats = Object.entries(stats).sort(([,a], [,b]) => b - a)
    return sortedStats[0]
  }

  const [topStatName, topStatValue] = getTopStat()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Level & XP */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-4 rounded-xl border border-indigo-800/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-indigo-300 font-semibold text-sm">Level</h3>
          <span className="text-2xl">⚡</span>
        </div>
        <p className="text-white text-2xl font-bold">{level}</p>
        <div className="mt-2">
          <div className="w-full bg-gray-800 h-2 rounded-full">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-gray-400 text-xs mt-1">{xpToNext} XP to next level</p>
        </div>
      </div>

      {/* Habits */}
      <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 p-4 rounded-xl border border-green-800/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-green-300 font-semibold text-sm">Habits</h3>
          <span className="text-2xl">🎯</span>
        </div>
        <p className="text-white text-2xl font-bold">{completedHabitsToday}/{habits.length}</p>
        <p className="text-gray-400 text-xs">completed today</p>
      </div>

      {/* Quests */}
      <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 p-4 rounded-xl border border-orange-800/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-orange-300 font-semibold text-sm">Quests</h3>
          <span className="text-2xl">⚔️</span>
        </div>
        <p className="text-white text-2xl font-bold">{activeTodos}</p>
        <p className="text-gray-400 text-xs">active quests</p>
      </div>

      {/* Top Stat */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-4 rounded-xl border border-purple-800/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-purple-300 font-semibold text-sm">Top Stat</h3>
          <span className="text-2xl">🏆</span>
        </div>
        <p className="text-white text-lg font-bold">{topStatName}</p>
        <p className="text-gray-400 text-xs">{topStatValue} XP</p>
      </div>
    </div>
  )
}
