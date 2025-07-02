'use client'
import React, { useState, useEffect } from 'react'
import { MotivationalContent } from '@/lib/types'
import { motivationalQuotes } from '@/lib/constants'

interface MotivationFeedProps {
  recentWins: string[];
  userLevel: number;
}

export default function MotivationFeed({ recentWins, userLevel }: MotivationFeedProps) {
  const [currentContent, setCurrentContent] = useState<MotivationalContent>(motivationalQuotes[0])
  const [futureMessage, setFutureMessage] = useState('')

  useEffect(() => {
    // Rotate content every 30 seconds
    const interval = setInterval(() => {
      const randomContent = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
      setCurrentContent(randomContent)
    }, 30000)

    // Generate future self message based on level
    generateFutureMessage()

    return () => clearInterval(interval)
  }, [userLevel])

  const generateFutureMessage = () => {
    const messages = [
      `Level ${userLevel + 5} you is amazed by your consistency today.`,
      `Your future self thanks you for not giving up during the tough moments.`,
      `The person you're becoming is proud of the choices you're making now.`,
      `Future you remembers this moment as a turning point.`,
      `Your level ${userLevel + 10} self is cheering you on right now.`
    ]
    setFutureMessage(messages[Math.floor(Math.random() * messages.length)])
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'quote': return '💭'
      case 'affirmation': return '✨'
      case 'future-self': return '🔮'
      case 'win': return '🏆'
      default: return '💫'
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Motivational Content */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-6 rounded-2xl border border-purple-800/50">
        <div className="flex items-center mb-3">
          <span className="text-2xl mr-3">{getContentIcon(currentContent.type)}</span>
          <h3 className="text-purple-300 font-semibold capitalize">
            {currentContent.type.replace('-', ' ')}
          </h3>
        </div>
        <p className="text-white text-lg italic mb-2">"{currentContent.content}"</p>
        {currentContent.author && (
          <p className="text-purple-400 text-sm">— {currentContent.author}</p>
        )}
      </div>

      {/* Future Self Message */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 p-4 rounded-xl border border-indigo-800/50">
        <div className="flex items-center mb-2">
          <span className="text-xl mr-2">🔮</span>
          <h4 className="text-indigo-300 font-medium text-sm">Message from Future You</h4>
        </div>
        <p className="text-gray-300 text-sm">{futureMessage}</p>
      </div>

      {/* Recent Wins */}
      {recentWins.length > 0 && (
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4 rounded-xl border border-green-800/50">
          <div className="flex items-center mb-3">
            <span className="text-xl mr-2">🏆</span>
            <h4 className="text-green-300 font-medium text-sm">Recent Wins</h4>
          </div>
          <div className="space-y-1">
            {recentWins.slice(-3).map((win, index) => (
              <p key={index} className="text-gray-300 text-xs flex items-center">
                <span className="text-green-400 mr-2">•</span>
                {win}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Daily Vibe Setter */}
      <div className="bg-black/40 p-4 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-xl mr-2">🎵</span>
            <h4 className="text-gray-300 font-medium text-sm">Today's Vibe</h4>
          </div>
          <button className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors">
            Set Mood
          </button>
        </div>
        <p className="text-gray-400 text-xs">
          {userLevel < 5 ? 'Building momentum...' : 
           userLevel < 15 ? 'Finding your rhythm...' : 
           'Mastering your flow...'}
        </p>
      </div>
    </div>
  )
}
