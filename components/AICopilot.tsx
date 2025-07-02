"use client"
import { useState, useEffect, useRef } from "react"
import { AICopilotService, type ChatMessage, type AIReflection } from "@/lib/ai/ai-copilot-service"
import { OpenAIClient } from "@/lib/ai/openai-client"
import type { Stats, Mission, JournalEntry, CheckInData, Habit } from "@/lib/types"

interface AICopilotProps {
  stats: Stats
  recentMood: number
  recentEnergy: number
  habits: Habit[]
  missions: Mission[]
  journalEntries: JournalEntry[]
  checkIns: CheckInData[]
  onSuggestMission: (mission: Mission) => void
  onAddJournalEntry: (entry: JournalEntry) => void
}

export default function AICopilot({
  stats,
  recentMood,
  recentEnergy,
  habits,
  missions,
  journalEntries,
  checkIns,
  onSuggestMission,
  onAddJournalEntry,
}: AICopilotProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "missions" | "reflections">("chat")
  const [aiService, setAiService] = useState<AICopilotService | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [isConfigured, setIsConfigured] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [currentMood, setCurrentMood] = useState(recentMood)
  const [currentEnergy, setCurrentEnergy] = useState(recentEnergy)

  // Missions state
  const [generatedMissions, setGeneratedMissions] = useState<Mission[]>([])
  const [isGeneratingMissions, setIsGeneratingMissions] = useState(false)
  const [missionsError, setMissionsError] = useState<string | null>(null)

  // Reflections state
  const [reflections, setReflections] = useState<AIReflection[]>([])
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false)
  const [reflectionError, setReflectionError] = useState<string | null>(null)
  const [selectedReflection, setSelectedReflection] = useState<AIReflection | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check for stored API key
    const storedKey = localStorage.getItem("openai_api_key")
    if (storedKey) {
      setApiKey(storedKey)
      initializeAI(storedKey)
    }
  }, [])

  useEffect(() => {
    if (aiService && aiService.isReady()) {
      setChatMessages(aiService.getChatHistory())
      setReflections(aiService.getStoredReflections())
    }
  }, [aiService])

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const initializeAI = async (key: string) => {
    setIsInitializing(true)
    setInitializationError(null)

    try {
      // Validate API key format first
      const validation = OpenAIClient.validateApiKey(key)
      if (!validation.valid) {
        setInitializationError(validation.error!)
        setIsInitializing(false)
        return
      }

      console.log("Initializing AI service...")
      const service = new AICopilotService(key)

      // Test the connection
      const initResult = await service.initialize()
      if (initResult.success) {
        setAiService(service)
        setIsConfigured(true)
        localStorage.setItem("openai_api_key", key)
        console.log("AI service initialized successfully")
      } else {
        setInitializationError(initResult.error || "Failed to initialize AI service")
        console.error("AI initialization failed:", initResult.error)
      }
    } catch (error) {
      console.error("Failed to initialize AI service:", error)
      setInitializationError(error instanceof Error ? error.message : "Unknown initialization error")
    } finally {
      setIsInitializing(false)
    }
  }

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      initializeAI(apiKey.trim())
    }
  }

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !aiService || isLoading) return

    setChatError(null)
    setIsLoading(true)

    try {
      console.log("Sending message to AI...")
      const result = await aiService.sendChatMessage(inputMessage, {
        mood: currentMood,
        energy: currentEnergy,
        stats,
        recentActivities: getRecentActivities(),
      })

      if (result.success) {
        setChatMessages(aiService.getChatHistory())
        setInputMessage("")
        console.log("Message sent successfully")

        // Focus back to input
        setTimeout(() => inputRef.current?.focus(), 100)
      } else {
        setChatError(result.error || "Failed to send message")
        console.error("Chat error:", result.error)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      setChatError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateMissions = async () => {
    if (!aiService || isGeneratingMissions) return

    setMissionsError(null)
    setIsGeneratingMissions(true)

    try {
      console.log("Generating missions...")
      const result = await aiService.generateDailyMissions({
        stats,
        mood: currentMood,
        energy: currentEnergy,
        habits,
        pastMissions: missions,
        checkIns,
      })

      if (result.success) {
        setGeneratedMissions(result.missions || [])
        console.log(`Generated ${result.missions?.length || 0} missions`)
      } else {
        setMissionsError(result.error || "Failed to generate missions")
        console.error("Missions generation error:", result.error)
      }
    } catch (error) {
      console.error("Failed to generate missions:", error)
      setMissionsError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsGeneratingMissions(false)
    }
  }

  const handleGenerateReflection = async () => {
    if (!aiService || isGeneratingReflection) return

    setReflectionError(null)
    setIsGeneratingReflection(true)

    try {
      console.log("Generating reflection...")
      const result = await aiService.generateReflection(journalEntries)

      if (result.success) {
        setReflections(aiService.getStoredReflections())
        setSelectedReflection(result.reflection || null)
        console.log("Reflection generated successfully")
      } else {
        setReflectionError(result.error || "Failed to generate reflection")
        console.error("Reflection generation error:", result.error)
      }
    } catch (error) {
      console.error("Failed to generate reflection:", error)
      setReflectionError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsGeneratingReflection(false)
    }
  }

  const getRecentActivities = (): string[] => {
    const activities: string[] = []

    // Recent completed habits
    const today = new Date().toDateString()
    const completedHabits = habits.filter((h) => h.completionHistory.includes(today))
    activities.push(...completedHabits.map((h) => `Completed ${h.name} habit`))

    // Recent missions
    const completedMissions = missions.filter((m) => m.completed).slice(-3)
    activities.push(...completedMissions.map((m) => `Completed mission: ${m.title}`))

    return activities.slice(-5)
  }

  const handleMoodChange = (mood: number) => {
    setCurrentMood(mood)
  }

  const handleEnergyChange = (energy: number) => {
    setCurrentEnergy(energy)
  }

  const getMoodEmoji = (mood: number) => {
    const emojis = ["😢", "😔", "😕", "😐", "🙂", "😊", "😄", "🤩", "🌟", "🚀"]
    return emojis[Math.max(0, Math.min(9, mood - 1))]
  }

  const handleClearApiKey = () => {
    localStorage.removeItem("openai_api_key")
    setApiKey("")
    setIsConfigured(false)
    setAiService(null)
    setInitializationError(null)
    setChatMessages([])
    setGeneratedMissions([])
    setReflections([])
  }

  if (!isConfigured) {
    return (
      <div className="bg-black/40 border border-indigo-800/50 rounded-2xl p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🤖</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">AI Copilot Setup</h2>
          <p className="text-gray-400 text-sm mb-6">Enter your OpenAI API key to unlock intelligent features</p>

          <div className="space-y-4">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === "Enter" && handleApiKeySubmit()}
              disabled={isInitializing}
            />

            {initializationError && (
              <div className="bg-red-900/30 border border-red-800/50 p-3 rounded-lg">
                <p className="text-red-300 text-sm">{initializationError}</p>
              </div>
            )}

            <button
              onClick={handleApiKeySubmit}
              disabled={!apiKey.trim() || isInitializing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white py-3 rounded-lg transition-colors"
            >
              {isInitializing ? "Initializing..." : "Initialize AI Copilot"}
            </button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Your API key is stored locally and never shared</p>
              <p>
                Get your key at: <span className="text-indigo-400">platform.openai.com</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black/40 border border-indigo-800/50 rounded-2xl p-6 h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Copilot</h2>
            <p className="text-gray-400 text-sm">Your intelligent growth companion</p>
          </div>
        </div>

        {/* Settings & Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-400">Connected</span>
          </div>
          <button onClick={handleClearApiKey} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-gray-800/50 rounded-lg p-1">
        {(["chat", "missions", "reflections"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all capitalize ${
              activeTab === tab ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && (
          <div className="h-full flex flex-col">
            {/* Mood & Energy Controls */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Mood: {currentMood}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentMood}
                    onChange={(e) => handleMoodChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center mt-1">
                    <span className="text-lg">{getMoodEmoji(currentMood)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Energy: {currentEnergy}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentEnergy}
                    onChange={(e) => handleEnergyChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center mt-1">
                    <span className="text-lg">⚡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {chatError && (
              <div className="mb-4 bg-red-900/30 border border-red-800/50 p-3 rounded-lg">
                <p className="text-red-300 text-sm">{chatError}</p>
                <button onClick={() => setChatError(null)} className="text-red-400 hover:text-red-300 text-xs mt-1">
                  Dismiss
                </button>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p className="mb-2">👋 Hi! I'm your AI Copilot</p>
                  <p className="text-sm">How are you feeling today? What's on your mind?</p>
                </div>
              )}

              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</span>
                      {message.mood && message.energy && (
                        <span className="text-xs opacity-70">
                          {getMoodEmoji(message.mood)} ⚡{message.energy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-300 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse">🤖</div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "missions" && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">AI-Generated Missions</h3>
              <button
                onClick={handleGenerateMissions}
                disabled={isGeneratingMissions}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {isGeneratingMissions ? "Generating..." : "Generate New"}
              </button>
            </div>

            {/* Error Display */}
            {missionsError && (
              <div className="mb-4 bg-red-900/30 border border-red-800/50 p-3 rounded-lg">
                <p className="text-red-300 text-sm">{missionsError}</p>
                <button onClick={() => setMissionsError(null)} className="text-red-400 hover:text-red-300 text-xs mt-1">
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3">
              {generatedMissions.map((mission) => (
                <div key={mission.id} className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">{mission.title}</h4>
                      <p className="text-gray-300 text-sm mb-2">{mission.description}</p>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-indigo-400">{mission.stat}</span>
                        <span className="text-green-400">+{mission.xpReward} XP</span>
                        <span className="text-purple-400">{mission.difficulty}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onSuggestMission(mission)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}

              {generatedMissions.length === 0 && !isGeneratingMissions && (
                <div className="text-center text-gray-400 py-8">
                  <p>No missions generated yet.</p>
                  <p className="text-sm mt-1">Click "Generate New" to create personalized missions!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "reflections" && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Journal Reflections</h3>
              <button
                onClick={handleGenerateReflection}
                disabled={isGeneratingReflection || journalEntries.length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {isGeneratingReflection ? "Analyzing..." : "Generate Reflection"}
              </button>
            </div>

            {/* Error Display */}
            {reflectionError && (
              <div className="mb-4 bg-red-900/30 border border-red-800/50 p-3 rounded-lg">
                <p className="text-red-300 text-sm">{reflectionError}</p>
                <button
                  onClick={() => setReflectionError(null)}
                  className="text-red-400 hover:text-red-300 text-xs mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {selectedReflection && (
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 rounded-lg border border-purple-800/50 mb-4">
                  <h4 className="text-purple-300 font-semibold mb-2">Latest Reflection</h4>
                  <p className="text-gray-300 text-sm mb-3">{selectedReflection.summary}</p>

                  {selectedReflection.patterns.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-purple-400 font-medium text-sm mb-1">Patterns Noticed:</h5>
                      <ul className="text-gray-300 text-xs space-y-1">
                        {selectedReflection.patterns.map((pattern, index) => (
                          <li key={index}>• {pattern}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReflection.insights.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-green-400 font-medium text-sm mb-1">Insights:</h5>
                      <ul className="text-gray-300 text-xs space-y-1">
                        {selectedReflection.insights.map((insight, index) => (
                          <li key={index}>• {insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReflection.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-blue-400 font-medium text-sm mb-1">Recommendations:</h5>
                      <ul className="text-gray-300 text-xs space-y-1">
                        {selectedReflection.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {reflections.length > 0 && (
                <div>
                  <h4 className="text-gray-300 font-medium mb-2">Previous Reflections</h4>
                  <div className="space-y-2">
                    {reflections
                      .slice()
                      .reverse()
                      .map((reflection) => (
                        <button
                          key={reflection.id}
                          onClick={() => setSelectedReflection(reflection)}
                          className="w-full text-left bg-gray-800/50 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-gray-300 text-sm line-clamp-2">{reflection.summary}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                {new Date(reflection.date).toLocaleDateString()} • {reflection.entriesAnalyzed} entries
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {reflections.length === 0 && journalEntries.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p>No journal entries to analyze yet.</p>
                  <p className="text-sm mt-1">Start journaling to get AI-powered insights!</p>
                </div>
              )}

              {reflections.length === 0 && journalEntries.length > 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p>Ready to analyze your journal entries!</p>
                  <p className="text-sm mt-1">Click "Generate Reflection" to get personalized insights.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
