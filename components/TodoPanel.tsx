"use client"
import type React from "react"
import { useState, useEffect } from "react"
import type { Todo, CheckInData, Stats } from "@/lib/types"
import { SmartRecommendationEngine, type TodoPriority } from "@/lib/ai/smart-recommendations"

interface TodoPanelProps {
  todos: Todo[]
  onAddTodo: (text: string) => void
  onCompleteTodo: (id: string) => void
  onDeleteTodo: (id: string) => void
  checkIns: CheckInData[]
  stats: Stats
}

export default function TodoPanel({ todos, onAddTodo, onCompleteTodo, onDeleteTodo, checkIns, stats }: TodoPanelProps) {
  const [inputText, setInputText] = useState("")
  const [priorities, setPriorities] = useState<TodoPriority[]>([])
  const [showPriorityInfo, setShowPriorityInfo] = useState(false)
  const [sortMode, setSortMode] = useState<"smart" | "created" | "manual">("smart")
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (sortMode === "smart") {
      analyzePriorities()
    }
  }, [todos, checkIns, stats, sortMode])

  const analyzePriorities = async () => {
    setIsAnalyzing(true)

    try {
      const todoPriorities = SmartRecommendationEngine.prioritizeTodos(todos, stats, checkIns)
      setPriorities(todoPriorities)
    } catch (error) {
      console.error("Failed to analyze todo priorities:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      onAddTodo(inputText.trim())
      setInputText("")
    }
  }

  const getSortedTodos = () => {
    const activeTodos = todos.filter((todo) => !todo.completed)

    switch (sortMode) {
      case "smart":
        return activeTodos.sort((a, b) => {
          const aPriority = priorities.find((p) => p.id === a.id)?.priority || 0
          const bPriority = priorities.find((p) => p.id === b.id)?.priority || 0
          return bPriority - aPriority
        })
      case "created":
        return activeTodos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      default:
        return activeTodos
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 7) return "border-red-500/50 bg-red-900/20"
    if (priority >= 5) return "border-yellow-500/50 bg-yellow-900/20"
    if (priority >= 3) return "border-blue-500/50 bg-blue-900/20"
    return "border-gray-700/50 bg-gray-800/50"
  }

  const getPriorityIcon = (priority: number) => {
    if (priority >= 7) return "🔥"
    if (priority >= 5) return "⚡"
    if (priority >= 3) return "📋"
    return "📝"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 7) return "High Priority"
    if (priority >= 5) return "Medium Priority"
    if (priority >= 3) return "Normal Priority"
    return "Low Priority"
  }

  const getContextualSuggestion = () => {
    const recentMood = checkIns.length > 0 ? checkIns[checkIns.length - 1].mood : 5
    const recentEnergy = checkIns.length > 0 ? checkIns[checkIns.length - 1].energy : 5

    if (recentMood < 5 && recentEnergy < 5) {
      return {
        icon: "🌱",
        text: "Consider starting with easier tasks to build momentum",
        color: "text-green-400",
      }
    } else if (recentEnergy > 7) {
      return {
        icon: "🚀",
        text: "Great energy! Perfect time for challenging tasks",
        color: "text-blue-400",
      }
    } else if (recentMood > 7) {
      return {
        icon: "✨",
        text: "Positive mood detected! Good time for creative tasks",
        color: "text-purple-400",
      }
    }

    return null
  }

  const activeTodos = getSortedTodos()
  const completedTodos = todos.filter((todo) => todo.completed)
  const contextSuggestion = getContextualSuggestion()

  return (
    <div className="bg-black/40 border border-indigo-800/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="mr-3">⚔️</span>
          Smart Quests
        </h2>
        <div className="flex items-center space-x-2">
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs"
          >
            <option value="smart">Smart Priority</option>
            <option value="created">Recently Added</option>
            <option value="manual">Manual Order</option>
          </select>
          <button
            onClick={() => setShowPriorityInfo(!showPriorityInfo)}
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            {isAnalyzing ? "⏳" : "ℹ️"}
          </button>
        </div>
      </div>

      {/* Contextual Suggestion */}
      {contextSuggestion && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="flex items-center">
            <span className="text-lg mr-2">{contextSuggestion.icon}</span>
            <p className={`text-sm ${contextSuggestion.color}`}>{contextSuggestion.text}</p>
          </div>
        </div>
      )}

      {/* Priority Info Panel */}
      {showPriorityInfo && sortMode === "smart" && (
        <div className="mb-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-4 rounded-xl border border-indigo-800/50">
          <h3 className="text-indigo-300 font-semibold mb-3 text-sm">Smart Prioritization</h3>
          <div className="space-y-2 text-xs text-gray-300">
            <p>
              • <span className="text-red-400">High Priority (🔥)</span>: Urgent or important tasks
            </p>
            <p>
              • <span className="text-yellow-400">Medium Priority (⚡)</span>: Important but not urgent
            </p>
            <p>
              • <span className="text-blue-400">Normal Priority (📋)</span>: Regular tasks
            </p>
            <p>
              • <span className="text-gray-400">Low Priority (📝)</span>: Can be done later
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Priority calculated based on keywords, your current mood/energy, time of day, and task importance.
            </p>
          </div>
        </div>
      )}

      {/* Add Todo Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Add a new quest... (try: 'urgent call client' or 'simple email task')"
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          💡 Use keywords like "urgent", "important", "quick", or "deadline" for smart prioritization
        </p>
      </form>

      {/* Active Todos */}
      <div className="space-y-3 mb-6">
        {activeTodos.map((todo) => {
          const todoPriority = priorities.find((p) => p.id === todo.id)
          const priorityValue = todoPriority?.priority || 0

          return (
            <div
              key={todo.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all group hover:scale-[1.02] ${getPriorityColor(priorityValue)}`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <button
                  onClick={() => onCompleteTodo(todo.id)}
                  className="w-5 h-5 rounded-full border-2 border-gray-600 hover:border-indigo-500 transition-colors flex items-center justify-center"
                >
                  <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-indigo-500 transition-colors"></div>
                </button>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {sortMode === "smart" && (
                      <span className="text-lg" title={getPriorityLabel(priorityValue)}>
                        {getPriorityIcon(priorityValue)}
                      </span>
                    )}
                    <span className="text-gray-300 text-sm">{todo.text}</span>
                  </div>

                  {sortMode === "smart" && todoPriority && todoPriority.reasoning && (
                    <p className="text-xs text-gray-500 mt-1 ml-6">{todoPriority.reasoning}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {sortMode === "smart" && (
                  <span className="text-xs text-indigo-400 font-mono">{priorityValue.toFixed(1)}</span>
                )}
                <span className="text-indigo-400 text-xs">+{todo.xpReward} XP</span>
                <button
                  onClick={() => onDeleteTodo(todo.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}

        {activeTodos.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">No active quests. Add one to start earning XP!</p>
        )}
      </div>

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div>
          <h3 className="text-green-300 font-semibold mb-3 text-sm flex items-center">
            <span className="mr-2">✅</span>
            Completed Today ({completedTodos.length})
          </h3>
          <div className="space-y-2">
            {completedTodos.slice(-3).map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between bg-green-900/20 p-2 rounded-lg border border-green-800/30"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 text-sm">✓</span>
                  <span className="text-gray-300 text-sm line-through opacity-75">{todo.text}</span>
                </div>
                <span className="text-green-400 text-xs">+{todo.xpReward} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Insights */}
      {sortMode === "smart" && priorities.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-800/50">
          <h3 className="text-purple-300 font-semibold mb-2 text-sm">📊 Task Insights</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-300">High Priority Tasks</p>
              <p className="text-red-400 font-bold">{priorities.filter((p) => p.priority >= 7).length}</p>
            </div>
            <div>
              <p className="text-gray-300">Quick Wins Available</p>
              <p className="text-green-400 font-bold">
                {
                  activeTodos.filter(
                    (t) => t.text.toLowerCase().includes("quick") || t.text.toLowerCase().includes("simple"),
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
