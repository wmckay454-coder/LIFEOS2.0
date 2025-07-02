interface OpenAIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  error?: {
    message: string
    type: string
    code: string
  }
}

export class OpenAIClient {
  private apiKey: string
  private baseURL = "https://api.openai.com/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Validate API key format
  static validateApiKey(apiKey: string): { valid: boolean; error?: string } {
    if (!apiKey) {
      return { valid: false, error: "API key is required" }
    }

    if (!apiKey.startsWith("sk-")) {
      return { valid: false, error: "API key must start with 'sk-'" }
    }

    if (apiKey.length < 20) {
      return { valid: false, error: "API key appears to be too short" }
    }

    return { valid: true }
  }

  // Test API key with a simple request
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return { success: true }
    } catch (error) {
      console.error("API connection test failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network connection failed",
      }
    }
  }

  async chat(
    messages: OpenAIMessage[],
    options: {
      model?: string
      temperature?: number
      maxTokens?: number
    } = {},
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    const { model = "gpt-3.5-turbo", temperature = 0.7, maxTokens = 500 } = options

    try {
      console.log("Sending chat request:", { model, messagesCount: messages.length })

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      })

      const data: OpenAIResponse = await response.json()

      if (!response.ok) {
        console.error("OpenAI API error:", data)
        return {
          success: false,
          error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      const content = data.choices[0]?.message?.content
      if (!content) {
        return {
          success: false,
          error: "No response content received from API",
        }
      }

      console.log("Chat response received successfully")
      return { success: true, content }
    } catch (error) {
      console.error("Chat request failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  async generateMissions(context: {
    mood: number
    energy: number
    timeOfDay: string
    recentHabits: string[]
    currentStats: Record<string, number>
    pastMissions: string[]
  }): Promise<{ success: boolean; missions?: string[]; error?: string }> {
    const systemPrompt = `You are a personal growth AI that creates daily missions. Generate exactly 3 personalized missions based on the user's current state. Each mission should be:
    - Specific and actionable
    - Appropriate for their mood and energy level
    - Aligned with their growth areas
    - Achievable within the day
    
    Respond with ONLY a JSON array of 3 strings, no additional text.
    Example: ["Take a 10-minute walk outside", "Read 5 pages of a book", "Practice gratitude by writing 3 things you're thankful for"]`

    const userPrompt = `Current state:
    - Mood: ${context.mood}/10
    - Energy: ${context.energy}/10
    - Time: ${context.timeOfDay}
    - Recent habits: ${context.recentHabits.length > 0 ? context.recentHabits.join(", ") : "None completed today"}
    - Stats: ${Object.entries(context.currentStats)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}
    - Recent missions: ${context.pastMissions.length > 0 ? context.pastMissions.slice(-3).join(", ") : "None"}`

    const result = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ])

    if (!result.success) {
      return { success: false, error: result.error }
    }

    try {
      const missions = JSON.parse(result.content!)
      if (!Array.isArray(missions) || missions.length !== 3) {
        throw new Error("Invalid missions format")
      }
      return { success: true, missions }
    } catch (parseError) {
      console.error("Failed to parse missions JSON:", result.content)
      // Fallback parsing
      const lines = result.content!.split("\n").filter((line) => line.trim())
      const missions = lines.slice(0, 3).map((line) => line.replace(/^[-*•]\s*/, "").trim())

      if (missions.length >= 2) {
        return { success: true, missions: missions.slice(0, 3) }
      }

      return { success: false, error: "Failed to parse missions response" }
    }
  }

  async generateReflection(
    journalEntries: Array<{
      date: string
      entry: string
      emotionalState: number
      tags: string[]
    }>,
  ): Promise<{
    success: boolean
    reflection?: {
      summary: string
      patterns: string[]
      insights: string[]
      recommendations: string[]
    }
    error?: string
  }> {
    const systemPrompt = `You are a thoughtful AI therapist analyzing journal entries. Provide:
    1. A compassionate summary of recent entries (2-3 sentences)
    2. 2-3 patterns you notice in thoughts/emotions
    3. 2-3 positive insights about growth
    4. 2-3 gentle recommendations for well-being
    
    Be supportive, non-judgmental, and focus on strengths. Respond with ONLY valid JSON in this exact format:
    {
      "summary": "string",
      "patterns": ["string1", "string2"],
      "insights": ["string1", "string2"],
      "recommendations": ["string1", "string2"]
    }`

    const entriesText = journalEntries
      .slice(-7)
      .map(
        (entry) =>
          `Date: ${new Date(entry.date).toLocaleDateString()}
      Mood: ${entry.emotionalState}/10
      Tags: ${entry.tags.join(", ") || "None"}
      Entry: ${entry.entry}`,
      )
      .join("\n\n")

    const result = await this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Recent journal entries:\n\n${entriesText}` },
      ],
      { temperature: 0.6 },
    )

    if (!result.success) {
      return { success: false, error: result.error }
    }

    try {
      const reflection = JSON.parse(result.content!)
      return { success: true, reflection }
    } catch (parseError) {
      console.error("Failed to parse reflection JSON:", result.content)
      return {
        success: false,
        error: "Failed to parse reflection response",
      }
    }
  }

  async chatResponse(
    message: string,
    context: {
      mood: number
      energy: number
      recentEntries: string[]
      userStats: Record<string, number>
      conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
    },
  ): Promise<{ success: boolean; content?: string; error?: string }> {
    const systemPrompt = `You are a supportive AI life coach. You help users with personal growth, habit building, and emotional well-being. 

    Current user context:
    - Mood: ${context.mood}/10
    - Energy: ${context.energy}/10
    - Recent activities: ${context.recentEntries.length > 0 ? context.recentEntries.join(", ") : "None"}
    - Growth stats: ${Object.entries(context.userStats)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}

    Be encouraging, practical, and personalized. Ask follow-up questions when appropriate. Keep responses concise but meaningful (2-3 sentences max).`

    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      ...context.conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: "user", content: message },
    ]

    return await this.chat(messages, { temperature: 0.8 })
  }
}
