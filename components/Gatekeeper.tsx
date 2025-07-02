'use client'
import React, { useState, useEffect } from 'react'

interface GatekeeperProps {
  onUnlock: () => void;
}

export default function Gatekeeper({ onUnlock }: GatekeeperProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [mode, setMode] = useState<'passkey' | 'intention' | 'reflection'>('passkey')
  const [intention, setIntention] = useState('')
  const [reflection, setReflection] = useState('')

  const passkey = 'rise'
  const reflectionPrompts = [
    'What do you hope to accomplish today?',
    'How are you feeling right now?',
    'What would make today meaningful?',
    'What are you grateful for in this moment?'
  ]

  useEffect(() => {
    const saved = localStorage.getItem('unlocked')
    const lastUnlock = localStorage.getItem('lastUnlock')
    const today = new Date().toDateString()
    
    if (saved === 'true' && lastUnlock === today) {
      setUnlocked(true)
      onUnlock()
    }
  }, [onUnlock])

  const handleUnlock = () => {
    let canUnlock = false

    switch (mode) {
      case 'passkey':
        canUnlock = input.trim().toLowerCase() === passkey
        break
      case 'intention':
        canUnlock = intention.trim().length > 10
        break
      case 'reflection':
        canUnlock = reflection.trim().length > 20
        break
    }

    if (canUnlock) {
      localStorage.setItem('unlocked', 'true')
      localStorage.setItem('lastUnlock', new Date().toDateString())
      if (intention) localStorage.setItem('dailyIntention', intention)
      if (reflection) localStorage.setItem('dailyReflection', reflection)
      setUnlocked(true)
      onUnlock()
    } else {
      setError('Please complete the requirement to continue.')
    }
  }

  if (unlocked) return null

  const currentPrompt = reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)]

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-indigo-950 to-black flex flex-col items-center justify-center text-center px-4 z-50">
      <div className="bg-black/60 border border-indigo-800 p-8 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-sm">
        <div className="mb-6">
          <h1 className="text-indigo-400 text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-300 text-sm">Choose your entry method</p>
        </div>

        <div className="flex justify-center mb-6 space-x-2">
          {(['passkey', 'intention', 'reflection'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                mode === m 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {mode === 'passkey' && (
          <div>
            <input
              type="password"
              className="w-full p-3 rounded-lg bg-black/50 border border-indigo-500 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter passkey..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
          </div>
        )}

        {mode === 'intention' && (
          <div>
            <label className="block text-gray-300 text-sm mb-2">Set your intention for today:</label>
            <textarea
              className="w-full p-3 rounded-lg bg-black/50 border border-indigo-500 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="I intend to..."
              rows={3}
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
            />
          </div>
        )}

        {mode === 'reflection' && (
          <div>
            <label className="block text-gray-300 text-sm mb-2">{currentPrompt}</label>
            <textarea
              className="w-full p-3 rounded-lg bg-black/50 border border-indigo-500 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Your reflection..."
              rows={4}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
          </div>
        )}

        <button
          onClick={handleUnlock}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
        >
          Enter Life OS
        </button>

        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
      </div>
    </div>
  )
}
