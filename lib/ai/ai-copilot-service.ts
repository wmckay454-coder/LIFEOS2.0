import { OpenAIClient } from "./openai-client"
import type { Stats, JournalEntry, Mission, CheckInData } from "@/lib/types"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  mood?: number
  energy?: number
}

export interface AIReflection {
  id: string
  date: string
  summary: string
  patterns: string[]
  insights: string[]
  recommendations: string[]
  entriesAnalyzed: number
}

export class AICopilotService {
  private openai: OpenAIClient
  private conversationHistory: ChatMessage[] = []
  private isInitialized = false

  constructor(apiKey: string) {
    this.openai = new OpenAIClient(apiKey)
    this.loadConversationHistory()
  }

  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      const testResult = await this.openai.testConnection()
      if (testResult.success) {
        this.isInitialized = true
        console.log("AI Copilot initialized successfully")
        return { success: true }
      } else {
        console.error("AI initialization failed:", testResult.error)
        return { success: false, error: testResult.error }
      }
    } catch (error) {
      console.error("AI initialization error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown initialization error",
      }
    }
  }

  isReady(): boolean {
    return this.isInitialized
  }

  private loadConversationHistory() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("ai_conversation_history")
        if (stored) {
          this.conversationHistory = JSON.parse(stored)
          console.log(`Loaded ${this.conversationHistory.length} chat messages`)
        }
      } catch (error) {
        console.error("Failed to load conversation history:", error)
        this.conversationHistory = []
      }
    }
  }

  private saveConversationHistory() {
    if (typeof window !== "undefined") {
      try {
        // Keep only last 20 messages to prevent storage bloat
        const recentHistory = this.conversationHistory.slice(-20)
        localStorage.setItem("ai_conversation_history", JSON.stringify(recentHistory))
        console.log(`Saved ${recentHistory.length} chat messages`)
      } catch (error) {
        console.error("Failed to save conversation history:", error)
      }
    }
  }

  async generateDailyMissions(context: {
    stats: Stats
    mood: number
    energy: number
    habits: Array<{ name: string; streak: number; completionHistory: string[] }>
    pastMissions: Mission[]
    checkIns: CheckInData[]
  }): Promise<{ success: boolean; missions?: Mission[]; error?: string }> {
    if (!this.isInitialized) {
      return { success: false, error: "AI service not initialized" }
    }

    const timeOfDay = this.getTimeOfDay()
    const recentHabits = context.habits
      .filter((h) => h.completionHistory.includes(new Date().toDateString()))
      .map((h) => h.name)

    const pastMissionTitles = context.pastMissions.filter((m) => m.isAIGenerated).map((m) => m.title)

    console.log("Generating missions with context:", {
      mood: context.mood,
      energy: context.energy,
      timeOfDay,
      recentHabits,
      pastMissionsCount: pastMissionTitles.length,
    })

    try {
      const result = await this.openai.generateMissions({
        mood: context.mood,
        energy: context.energy,
        timeOfDay,
        recentHabits,
        currentStats: context.stats,
        pastMissions: pastMissionTitles,
      })

      if (!result.success) {
        return { success: false, error: result.error }
      }

      const missions = result.missions!.map((description, index) => ({
        id: `ai-mission-${Date.now()}-${index}`,
        title: this.extractMissionTitle(description),
        description: description,
        stat: this.selectOptimalStat(context.stats),
        xpReward: this.calculateXPReward(context.mood, context.energy),
        completed: false,
        difficulty: this.determineDifficulty(context.energy),
        isAIGenerated: true,
      }))

      console.log(`Generated ${missions.length} missions successfully`)
      return { success: true, missions }
    } catch (error) {
      console.error("Failed to generate AI missions:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error generating missions",
      }
    }
  }

  async generateReflection(journalEntries: JournalEntry[]): Promise<{
    success: boolean
    reflection?: AIReflection
    error?: string
  }> {
    if (!this.isInitialized) {
      return { success: false, error: "AI service not initialized" }
    }

    if (journalEntries.length === 0) {
      const fallbackReflection: AIReflection = {
        id: `reflection-${Date.now()}`,
        date: new Date().toISOString(),
        summary: "No journal entries to analyze yet. Start writing to get personalized insights!",
        patterns: [],
        insights: [],
        recommendations: ["Begin journaling regularly to track your thoughts and emotions"],
        entriesAnalyzed: 0,
      }
      return { success: true, reflection: fallbackReflection }
    }

    console.log(`Generating reflection for ${journalEntries.length} journal entries`)

    try {
      const result = await this.openai.generateReflection(journalEntries)

      if (!result.success) {
        return { success: false, error: result.error }
      }

      const aiReflection: AIReflection = {
        id: `reflection-${Date.now()}`,
        date: new Date().toISOString(),
        summary: result.reflection!.summary,
        patterns: Array.isArray(result.reflection!.patterns) ? result.reflection!.patterns : [],
        insights: Array.isArray(result.reflection!.insights) ? result.reflection!.insights : [],
        recommendations: Array.isArray(result.reflection!.recommendations) ? result.reflection!.recommendations : [],
        entriesAnalyzed: Math.min(journalEntries.length, 7),
      }

      // Save reflection
      this.saveReflection(aiReflection)
      console.log("Generated reflection successfully")
      return { success: true, reflection: aiReflection }
    } catch (error) {
      console.error("Failed to generate reflection:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error generating reflection",
      }
    }
  }

  async sendChatMessage(
    message: string,
    userContext: {
      mood: number
      energy: number
      stats: Stats
      recentActivities: string[]
    },
  ): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
    if (!this.isInitialized) {
      return { success: false, error: "AI service not initialized" }
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      mood: userContext.mood,
      energy: userContext.energy,
    }

    this.conversationHistory.push(userMessage)
    console.log("Sending chat message:", message.substring(0, 50) + "...")

    try {
      // Get AI response
      const result = await this.openai.chatResponse(message, {
        mood: userContext.mood,
        energy: userContext.energy,
        recentEntries: userContext.recentActivities,
        userStats: userContext.stats,
        conversationHistory: this.conversationHistory.slice(-6).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      })

      if (!result.success) {
        return { success: false, error: result.error }
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: result.content!,
        timestamp: new Date().toISOString(),
      }

      this.conversationHistory.push(assistantMessage)
      this.saveConversationHistory()

      console.log("Received chat response successfully")
      return { success: true, message: assistantMessage }
    } catch (error) {
      console.error("Failed to get AI chat response:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error in chat",
      }
    }
  }

  getChatHistory(): ChatMessage[] {
    return [...this.conversationHistory]
  }

  clearChatHistory() {
    this.conversationHistory = []
    this.saveConversationHistory()
    console.log("Chat history cleared")
  }

  getStoredReflections(): AIReflection[] {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("ai_reflections")
        return stored ? JSON.parse(stored) : []
      } catch (error) {
        console.error("Failed to load reflections:", error)
        return []
      }
    }
    return []
  }

  private saveReflection(reflection: AIReflection) {
    if (typeof window !== "undefined") {
      try {
        const reflections = this.getStoredReflections()
        reflections.push(reflection)
        // Keep only last 10 reflections
        const recentReflections = reflections.slice(-10)
        localStorage.setItem("ai_reflections", JSON.stringify(recentReflections))
        console.log("Reflection saved successfully")
      } catch (error) {
        console.error("Failed to save reflection:", error)
      }
    }
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours()
    if (hour < 6) return "early morning"
    if (hour < 12) return "morning"
    if (hour < 17) return "afternoon"
    if (hour < 21) return "evening"
    return "night"
  }

  private extractMissionTitle(description: string): string {
    // Extract first few words as title
    const words = description.split(" ").slice(0, 4)
    return words.join(" ").replace(/[^\w\s]/g, "")
  }

  private selectOptimalStat(stats: Stats): keyof Stats {
    // Select the stat with lowest value for balanced growth
    const entries = Object.entries(stats) as [keyof Stats, number][]
    return entries.reduce((min, [stat, value]) => (value < stats[min] ? stat : min), entries[0][0])
  }

  private calculateXPReward(mood: number, energy: number): number {
    const baseXP = 20
    const moodBonus = mood > 7 ? 5 : 0
    const energyBonus = energy > 7 ? 5 : 0
    return baseXP + moodBonus + energyBonus
  }

  private determineDifficulty(energy: number): Mission["difficulty"] {
    if (energy <= 4) return "easy"
    if (energy <= 7) return "medium"
    return "hard"
  }
}
