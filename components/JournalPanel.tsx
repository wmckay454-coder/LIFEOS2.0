"use client"
import { useState, useEffect } from "react"
import type { JournalEntry, CheckInData, Habit, Stats } from "@/lib/types"
import { SmartRecommendationEngine, type JournalPrompt, type StressIndicator } from "@/lib/ai/smart-recommendations"

interface JournalPanelProps {
  entries: JournalEntry[]
  onAddEntry: (entry: JournalEntry) => void
  checkIns: CheckInData[]
  habits: Habit[]
  stats: Stats
}

export default function JournalPanel({ entries, onAddEntry, checkIns, habits, stats }: JournalPanelProps) {
  const [newEntry, setNewEntry] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [emotionalState, setEmotionalState] = useState(5)
  const [showPrompts, setShowPrompts] = useState(false)
  const [stressIndicators, setStressIndicators] = useState<StressIndicator[]>([])
  const [suggestedPrompts, setSuggestedPrompts] = useState<JournalPrompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const availableTags = [
    "grateful",
    "anxious",
    "excited",
    "tired",
    "motivated",
    "peaceful",
    "stressed",
    "hopeful",
    "creative",
    "focused",
  ]

  useEffect(() => {
    analyzeUserState()
  }, [entries, checkIns, habits, stats])

  const analyzeUserState = async () => {
    setIsAnalyzing(true)

    try {
      // Analyze stress indicators
      const indicators = SmartRecommendationEngine.analyzeStressIndicators({
        recentEntries: entries,
        checkIns,
        habits,
        stats,
      })

      setStressIndicators(indicators)

      // Generate contextual prompts
      const prompts = SmartRecommendationEngine.generateJournalPrompts(indicators, entries, stats)

      setSuggestedPrompts(prompts)
    } catch (error) {
      console.error("Failed to analyze user state:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = () => {
    if (newEntry.trim()) {
      const entry: JournalEntry = {
        date: new Date().toISOString(),
        entry: newEntry,
        tags: selectedTags,
        emotionalState,
        isAIGuided: selectedPrompt !== null,
      }
      onAddEntry(entry)
      setNewEntry("")
      setSelectedTags([])
      setEmotionalState(5)
      setSelectedPrompt(null)

      // Re-analyze after new entry
      setTimeout(analyzeUserState, 1000)
    }
  }

  const handleUsePrompt = (prompt: JournalPrompt) => {
    setSelectedPrompt(prompt)
    setNewEntry(prompt.prompt + "\n\n")
    setShowPrompts(false)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStressIndicatorColor = (severity: StressIndicator["severity"]) => {
    switch (severity) {
      case "high":
        return "text-red-400 bg-red-900/30 border-red-800/50"
      case "medium":
        return "text-yellow-400 bg-yellow-900/30 border-yellow-800/50"
      case "low":
        return "text-blue-400 bg-blue-900/30 border-blue-800/50"
    }
  }

  const getPromptCategoryIcon = (category: JournalPrompt["category"]) => {
    switch (category) {
      case "stress":
        return "🧘"
      case "gratitude":
        return "🙏"
      case "goals":
        return "🎯"
      case "reflection":
        return "💭"
      case "growth":
        return "🌱"
      case "relationships":
        return "💝"
      default:
        return "✨"
    }
  }

  return (
    <div className="bg-black/40 border border-indigo-800/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="mr-3">📝</span>
          Smart Journal
        </h2>
        <button
          onClick={() => setShowPrompts(!showPrompts)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
        >
          {isAnalyzing ? "Analyzing..." : "Get Prompts"}
        </button>
      </div>

      {/* Stress Indicators */}
      {stressIndicators.length > 0 && (
        <div className="mb-6">
          <h3 className="text-indigo-300 font-semibold mb-3 text-sm">Wellness Insights</h3>
          <div className="space-y-2">
            {stressIndicators.slice(0, 2).map((indicator, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getStressIndicatorColor(indicator.severity)}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">{indicator.type} Alert</p>
                  <span className="text-xs opacity-75">{Math.round(indicator.confidence * 100)}% confidence</span>
                </div>
                <p className="text-xs mt-1 opacity-90">{indicator.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Prompts */}
      {showPrompts && suggestedPrompts.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 rounded-xl border border-purple-800/50">
          <h3 className="text-purple-300 font-semibold mb-3 text-sm">Personalized Writing Prompts</h3>
          <div className="space-y-3">
            {suggestedPrompts.map((prompt) => (
              <div key={prompt.id} className="bg-black/30 p-3 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getPromptCategoryIcon(prompt.category)}</span>
                    <span className="text-purple-400 text-xs font-medium capitalize">{prompt.category}</span>
                  </div>
                  <button
                    onClick={() => handleUsePrompt(prompt)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs transition-colors"
                  >
                    Use
                  </button>
                </div>
                <p className="text-gray-300 text-sm mb-2">{prompt.prompt}</p>
                <p className="text-gray-500 text-xs">{prompt.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Prompt Indicator */}
      {selectedPrompt && (
        <div className="mb-4 bg-indigo-900/30 p-3 rounded-lg border border-indigo-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg mr-2">{getPromptCategoryIcon(selectedPrompt.category)}</span>
              <span className="text-indigo-300 text-sm">Using AI-guided prompt</span>
            </div>
            <button
              onClick={() => {
                setSelectedPrompt(null)
                setNewEntry("")
              }}
              className="text-gray-400 hover:text-white text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* New Entry Form */}
      <div className="mb-6 space-y-4">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder={selectedPrompt ? "Continue writing your response..." : "What's on your mind today?"}
          className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Emotional State Slider */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Emotional State: {emotionalState}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={emotionalState}
            onChange={(e) => setEmotionalState(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #f59e0b ${emotionalState * 10}%, #10b981 100%)`,
            }}
          />
        </div>

        {/* Smart Tags */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Tags:</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!newEntry.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white py-2 rounded-lg transition-colors"
        >
          {selectedPrompt ? "Save Guided Entry" : "Add Entry"}
        </button>
      </div>

      {/* Recent Entries */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <h3 className="text-indigo-300 font-semibold">Recent Entries</h3>
        {entries
          .slice(-5)
          .reverse()
          .map((entry, index) => (
            <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-indigo-400">Mood: {entry.emotionalState}/10</span>
                  {entry.isAIGuided && (
                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full">AI-Guided</span>
                  )}
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-2">{entry.entry}</p>
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {entry.aiResponse && (
                <div className="mt-3 p-3 bg-purple-900/30 rounded-lg border border-purple-800/50">
                  <p className="text-purple-300 text-xs font-medium mb-1">AI Response:</p>
                  <p className="text-gray-300 text-xs">{entry.aiResponse}</p>
                </div>
              )}
            </div>
          ))}
        {entries.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">
            No journal entries yet. Start writing to track your journey and get personalized insights!
          </p>
        )}
      </div>
    </div>
  )
}
