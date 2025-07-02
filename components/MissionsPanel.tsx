'use client'
import React from 'react'
import { Mission } from '@/lib/types'

interface MissionsPanelProps {
  missions: Mission[];
  onCompleteMission: (missionId: string) => void;
}

export default function MissionsPanel({ missions, onCompleteMission }: MissionsPanelProps) {
  const getDifficultyColor = (difficulty: Mission['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-800/50'
      case 'medium': return 'text-yellow-400 border-yellow-800/50'
      case 'hard': return 'text-red-400 border-red-800/50'
      default: return 'text-gray-400 border-gray-800/50'
    }
  }

  const getDifficultyIcon = (difficulty: Mission['difficulty']) => {
    switch (difficulty) {
      case 'easy': return '⭐'
      case 'medium': return '⭐⭐'
      case 'hard': return '⭐⭐⭐'
      default: return '⭐'
    }
  }

  const activeMissions = missions.filter(m => !m.completed)
  const completedMissions = missions.filter(m => m.completed)

  return (
    <div className="bg-black/40 border border-indigo-800/50 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <span className="mr-3">🎯</span>
        Daily Missions
      </h2>

      {/* Active Missions */}
      <div className="mb-6">
        <h3 className="text-indigo-300 font-semibold mb-3">Active Missions</h3>
        <div className="space-y-3">
          {activeMissions.map((mission) => (
            <div
              key={mission.id}
              className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-lg hover:border-indigo-600/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">{mission.title}</h4>
                  <p className="text-gray-300 text-sm mb-2">{mission.description}</p>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-indigo-400">{mission.stat}</span>
                    <span className="text-green-400">+{mission.xpReward} XP</span>
                    <span className={`${getDifficultyColor(mission.difficulty)}`}>
                      {getDifficultyIcon(mission.difficulty)} {mission.difficulty}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onCompleteMission(mission.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors group-hover:scale-105"
                >
                  Complete
                </button>
              </div>
            </div>
          ))}
          {activeMissions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">All missions completed! 🎉</p>
              <p className="text-gray-500 text-xs mt-1">New missions will be available tomorrow</p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <div>
          <h3 className="text-green-300 font-semibold mb-3 flex items-center">
            <span className="mr-2">✅</span>
            Completed Today
          </h3>
          <div className="space-y-2">
            {completedMissions.slice(-3).map((mission) => (
              <div
                key={mission.id}
                className="bg-green-900/20 border border-green-800/30 p-3 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-green-300 font-medium text-sm">{mission.title}</h4>
                    <p className="text-gray-400 text-xs">{mission.stat} • +{mission.xpReward} XP</p>
                  </div>
                  <span className="text-green-400 text-lg">🏆</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-800/50">
        <h3 className="text-purple-300 font-semibold mb-2">Today's Progress</h3>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">
            {completedMissions.length} / {missions.length} missions completed
          </span>
          <div className="w-24 bg-gray-800 h-2 rounded-full">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${missions.length > 0 ? (completedMissions.length / missions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
