import type { JournalEntry, Stats, Todo, CheckInData, Habit } from "@/lib/types"

export interface StressIndicator {
  type: "mood" | "energy" | "keywords" | "frequency" | "sleep" | "habits"
  severity: "low" | "medium" | "high"
  description: string
  confidence: number
}

export interface JournalPrompt {
  id: string
  prompt: string
  category: "stress" | "gratitude" | "goals" | "reflection" | "growth" | "relationships"
  priority: number
  reasoning: string
}

export interface StatInsight {
  stat: keyof Stats
  status: "lagging" | "balanced" | "excelling"
  recommendation: string
  suggestedActions: string[]
  priority: "low" | "medium" | "high"
}

export interface TodoPriority {
  id: string
  priority: number
  reasoning: string
  urgencyScore: number
  importanceScore: number
  contextScore: number
}

export class SmartRecommendationEngine {
  // Analyze stress indicators from various data sources
  static analyzeStressIndicators(data: {
    recentEntries: JournalEntry[]
    checkIns: CheckInData[]
    habits: Habit[]
    stats: Stats
  }): StressIndicator[] {
    const indicators: StressIndicator[] = []

    // Analyze mood patterns
    const recentMoods = data.checkIns.slice(-7).map((c) => c.mood)
    if (recentMoods.length > 0) {
      const avgMood = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length
      const moodTrend = this.calculateTrend(recentMoods)

      if (avgMood < 4) {
        indicators.push({
          type: "mood",
          severity: avgMood < 3 ? "high" : "medium",
          description: `Average mood is ${avgMood.toFixed(1)}/10 over the last week`,
          confidence: 0.8,
        })
      }

      if (moodTrend < -0.5) {
        indicators.push({
          type: "mood",
          severity: "medium",
          description: "Mood has been declining recently",
          confidence: 0.7,
        })
      }
    }

    // Analyze energy patterns
    const recentEnergy = data.checkIns.slice(-7).map((c) => c.energy)
    if (recentEnergy.length > 0) {
      const avgEnergy = recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length

      if (avgEnergy < 4) {
        indicators.push({
          type: "energy",
          severity: avgEnergy < 3 ? "high" : "medium",
          description: `Energy levels are low (${avgEnergy.toFixed(1)}/10)`,
          confidence: 0.8,
        })
      }
    }

    // Analyze journal keywords for stress
    const stressKeywords = [
      "stressed",
      "anxious",
      "worried",
      "overwhelmed",
      "tired",
      "exhausted",
      "frustrated",
      "angry",
      "sad",
      "depressed",
      "lonely",
      "confused",
      "pressure",
      "deadline",
      "busy",
      "chaos",
      "difficult",
      "struggle",
    ]

    const recentEntries = data.recentEntries.slice(-5)
    const stressKeywordCount = recentEntries.reduce((count, entry) => {
      const text = entry.entry.toLowerCase()
      return count + stressKeywords.filter((keyword) => text.includes(keyword)).length
    }, 0)

    if (stressKeywordCount > 3) {
      indicators.push({
        type: "keywords",
        severity: stressKeywordCount > 6 ? "high" : "medium",
        description: `Detected ${stressKeywordCount} stress-related keywords in recent entries`,
        confidence: 0.6,
      })
    }

    // Analyze journaling frequency
    const daysSinceLastEntry =
      recentEntries.length > 0
        ? Math.floor((Date.now() - new Date(recentEntries[0].date).getTime()) / (1000 * 60 * 60 * 24))
        : 30

    if (daysSinceLastEntry > 7) {
      indicators.push({
        type: "frequency",
        severity: daysSinceLastEntry > 14 ? "high" : "medium",
        description: `Haven't journaled in ${daysSinceLastEntry} days`,
        confidence: 0.5,
      })
    }

    // Analyze habit completion
    const today = new Date().toDateString()
    const completedHabitsToday = data.habits.filter((h) => h.completionHistory.includes(today)).length
    const completionRate = data.habits.length > 0 ? completedHabitsToday / data.habits.length : 0

    if (completionRate < 0.5) {
      indicators.push({
        type: "habits",
        severity: completionRate < 0.25 ? "high" : "medium",
        description: `Only ${Math.round(completionRate * 100)}% of habits completed today`,
        confidence: 0.7,
      })
    }

    return indicators.sort((a, b) => b.confidence - a.confidence)
  }

  // Generate contextual journal prompts based on stress indicators
  static generateJournalPrompts(
    stressIndicators: StressIndicator[],
    recentEntries: JournalEntry[],
    userStats: Stats,
  ): JournalPrompt[] {
    const prompts: JournalPrompt[] = []
    const usedPrompts = new Set(recentEntries.slice(-10).map((e) => e.entry.substring(0, 50)))

    // Stress-specific prompts
    const highStressIndicators = stressIndicators.filter((i) => i.severity === "high")
    if (highStressIndicators.length > 0) {
      const stressPrompts = [
        "What's the biggest source of stress in your life right now, and what's one small step you could take to address it?",
        "Describe a moment today when you felt overwhelmed. What triggered that feeling?",
        "If you could remove one stressor from your life, what would it be and why?",
        "What are three things that usually help you feel calmer when you're stressed?",
        "Write about a time when you successfully overcame a stressful situation. What did you learn?",
      ]

      stressPrompts.forEach((prompt, index) => {
        if (!this.isPromptUsedRecently(prompt, usedPrompts)) {
          prompts.push({
            id: `stress-${index}`,
            prompt,
            category: "stress",
            priority: 10,
            reasoning: `High stress indicators detected: ${highStressIndicators.map((i) => i.description).join(", ")}`,
          })
        }
      })
    }

    // Mood-based prompts
    const moodIndicators = stressIndicators.filter((i) => i.type === "mood")
    if (moodIndicators.length > 0) {
      const moodPrompts = [
        "What's one thing that brought you joy today, even if it was small?",
        "Describe your emotional state right now without judgment. What do you notice?",
        "What would you tell a friend who was feeling the way you feel right now?",
        "Write about a person who makes you feel better when you're down.",
        "What's one activity that consistently improves your mood?",
      ]

      moodPrompts.forEach((prompt, index) => {
        if (!this.isPromptUsedRecently(prompt, usedPrompts)) {
          prompts.push({
            id: `mood-${index}`,
            prompt,
            category: "reflection",
            priority: 8,
            reasoning: `Mood concerns detected: ${moodIndicators[0].description}`,
          })
        }
      })
    }

    // Growth-focused prompts based on stats
    const lowestStat = Object.entries(userStats).reduce((min, [stat, value]) =>
      value < userStats[min[0] as keyof Stats] ? [stat, value] : min,
    )

    const growthPrompts = {
      MIND: [
        "What's something new you'd like to learn, and what's stopping you from starting?",
        "Describe a recent moment when you felt intellectually challenged in a good way.",
        "What book, podcast, or idea has influenced your thinking lately?",
      ],
      BODY: [
        "How does your body feel right now? What is it telling you?",
        "What's one small change you could make to take better care of your physical health?",
        "Describe a time when you felt strong and energized. What contributed to that feeling?",
      ],
      SPIRIT: [
        "What are you most grateful for in this moment?",
        "When do you feel most connected to something larger than yourself?",
        "What values are most important to you, and how are you living them?",
      ],
      WORK: [
        "What aspect of your work or responsibilities brings you the most satisfaction?",
        "Describe a recent accomplishment you're proud of, no matter how small.",
        "What's one skill you'd like to develop to advance your goals?",
      ],
      PLAY: [
        "When was the last time you did something purely for fun? How did it feel?",
        "What activity makes you lose track of time in the best way?",
        "Describe a perfect day of relaxation and enjoyment for you.",
      ],
    }

    const statPrompts = growthPrompts[lowestStat[0] as keyof typeof growthPrompts] || []
    statPrompts.forEach((prompt, index) => {
      if (!this.isPromptUsedRecently(prompt, usedPrompts)) {
        prompts.push({
          id: `growth-${lowestStat[0]}-${index}`,
          prompt,
          category: "growth",
          priority: 6,
          reasoning: `${lowestStat[0]} stat needs attention (${lowestStat[1]} XP)`,
        })
      }
    })

    // General reflection prompts
    const generalPrompts = [
      "What's one thing you learned about yourself today?",
      "If today was a color, what would it be and why?",
      "What's something you're looking forward to?",
      "Describe a moment today when you felt proud of yourself.",
      "What's one way you showed kindness today, to yourself or others?",
    ]

    generalPrompts.forEach((prompt, index) => {
      if (!this.isPromptUsedRecently(prompt, usedPrompts) && prompts.length < 5) {
        prompts.push({
          id: `general-${index}`,
          prompt,
          category: "reflection",
          priority: 3,
          reasoning: "General self-reflection to maintain journaling habit",
        })
      }
    })

    return prompts.sort((a, b) => b.priority - a.priority).slice(0, 3)
  }

  // Analyze stats and provide insights
  static analyzeStats(
    stats: Stats,
    habits: Habit[],
    recentEntries: JournalEntry[],
    checkIns: CheckInData[],
  ): StatInsight[] {
    const insights: StatInsight[] = []
    const totalXP = Object.values(stats).reduce((sum, val) => sum + val, 0)
    const avgXP = totalXP / Object.keys(stats).length

    Object.entries(stats).forEach(([statName, value]) => {
      const stat = statName as keyof Stats
      const percentageOfAvg = avgXP > 0 ? (value / avgXP) * 100 : 100

      let status: StatInsight["status"] = "balanced"
      let priority: StatInsight["priority"] = "low"
      let recommendation = ""
      let suggestedActions: string[] = []

      if (percentageOfAvg < 70) {
        status = "lagging"
        priority = percentageOfAvg < 50 ? "high" : "medium"
      } else if (percentageOfAvg > 130) {
        status = "excelling"
        priority = "low"
      }

      // Generate specific recommendations based on stat
      switch (stat) {
        case "MIND":
          if (status === "lagging") {
            recommendation = `Your MIND stat is ${Math.round(percentageOfAvg)}% of your average. Focus on learning and mental stimulation.`
            suggestedActions = [
              "Read for 15 minutes daily",
              "Try a new puzzle or brain game",
              "Listen to an educational podcast",
              "Learn a new skill online",
              "Write in your journal more frequently",
            ]
          } else if (status === "excelling") {
            recommendation = `Excellent mental growth! Your MIND stat is ${Math.round(percentageOfAvg)}% of average.`
            suggestedActions = [
              "Share your knowledge with others",
              "Take on a challenging project",
              "Mentor someone in your area of expertise",
            ]
          }
          break

        case "BODY":
          if (status === "lagging") {
            recommendation = `Your BODY stat needs attention (${Math.round(percentageOfAvg)}% of average). Prioritize physical wellness.`
            suggestedActions = [
              "Take a 10-minute walk daily",
              "Do 5 minutes of stretching",
              "Drink more water throughout the day",
              "Get 7-8 hours of sleep",
              "Try a new physical activity",
            ]
          } else if (status === "excelling") {
            recommendation = `Great physical progress! Your BODY stat is thriving.`
            suggestedActions = [
              "Set a new fitness challenge",
              "Try a different type of exercise",
              "Help others with their fitness goals",
            ]
          }
          break

        case "SPIRIT":
          if (status === "lagging") {
            recommendation = `Your SPIRIT stat could use more attention. Focus on mindfulness and connection.`
            suggestedActions = [
              "Practice 5 minutes of meditation",
              "Write down 3 things you're grateful for",
              "Spend time in nature",
              "Connect with a friend or family member",
              "Practice deep breathing exercises",
            ]
          }
          break

        case "WORK":
          if (status === "lagging") {
            recommendation = `Your WORK stat is behind. Focus on productivity and skill development.`
            suggestedActions = [
              "Set clear daily priorities",
              "Use the Pomodoro Technique",
              "Learn a work-related skill",
              "Organize your workspace",
              "Set specific, measurable goals",
            ]
          }
          break

        case "PLAY":
          if (status === "lagging") {
            recommendation = `Don't forget to have fun! Your PLAY stat needs more attention.`
            suggestedActions = [
              "Schedule time for a hobby",
              "Try a new recreational activity",
              "Spend time with friends",
              "Play a game you enjoy",
              "Do something creative",
            ]
          }
          break
      }

      if (recommendation) {
        insights.push({
          stat,
          status,
          recommendation,
          suggestedActions: suggestedActions.slice(0, 3),
          priority,
        })
      }
    })

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // Auto-prioritize todos based on multiple factors
  static prioritizeTodos(
    todos: Todo[],
    userStats: Stats,
    checkIns: CheckInData[],
    currentTime: Date = new Date(),
  ): TodoPriority[] {
    return todos
      .filter((todo) => !todo.completed)
      .map((todo) => {
        let urgencyScore = 0
        let importanceScore = 0
        let contextScore = 0

        // Analyze urgency based on keywords and time
        const urgentKeywords = ["urgent", "asap", "deadline", "due", "important", "critical", "emergency"]
        const todoText = todo.text.toLowerCase()

        urgentKeywords.forEach((keyword) => {
          if (todoText.includes(keyword)) {
            urgencyScore += 2
          }
        })

        // Time-based urgency (if created recently, might be more urgent)
        const hoursOld = (currentTime.getTime() - new Date(todo.createdAt).getTime()) / (1000 * 60 * 60)
        if (hoursOld < 2) urgencyScore += 1
        if (hoursOld > 48) urgencyScore -= 1

        // Analyze importance based on XP reward and content
        importanceScore = Math.min(todo.xpReward / 5, 5) // Normalize XP to 0-5 scale

        const importantKeywords = ["goal", "project", "meeting", "presentation", "interview", "exam", "health"]
        importantKeywords.forEach((keyword) => {
          if (todoText.includes(keyword)) {
            importanceScore += 1
          }
        })

        // Context score based on user's current state
        const recentMood = checkIns.length > 0 ? checkIns[checkIns.length - 1].mood : 5
        const recentEnergy = checkIns.length > 0 ? checkIns[checkIns.length - 1].energy : 5

        // Suggest easier tasks when mood/energy is low
        const easyKeywords = ["quick", "simple", "easy", "call", "email", "text"]
        const hardKeywords = ["complex", "difficult", "challenging", "research", "analyze", "create"]

        if (recentMood < 5 || recentEnergy < 5) {
          easyKeywords.forEach((keyword) => {
            if (todoText.includes(keyword)) contextScore += 2
          })
          hardKeywords.forEach((keyword) => {
            if (todoText.includes(keyword)) contextScore -= 1
          })
        } else {
          hardKeywords.forEach((keyword) => {
            if (todoText.includes(keyword)) contextScore += 1
          })
        }

        // Time of day context
        const hour = currentTime.getHours()
        if (hour >= 9 && hour <= 11) {
          // Morning - good for important tasks
          if (importanceScore > 3) contextScore += 1
        } else if (hour >= 14 && hour <= 16) {
          // Afternoon - good for routine tasks
          if (todoText.includes("routine") || todoText.includes("admin")) contextScore += 1
        }

        // Calculate final priority (0-10 scale)
        const priority = Math.min(Math.max(urgencyScore * 0.4 + importanceScore * 0.4 + contextScore * 0.2, 0), 10)

        // Generate reasoning
        const reasoning = []
        if (urgencyScore > 2) reasoning.push("High urgency detected")
        if (importanceScore > 3) reasoning.push("High importance")
        if (contextScore > 1) reasoning.push("Good fit for current state")
        if (contextScore < 0) reasoning.push("Consider when energy is higher")

        return {
          id: todo.id,
          priority: Math.round(priority * 10) / 10,
          reasoning: reasoning.length > 0 ? reasoning.join(", ") : "Standard priority",
          urgencyScore,
          importanceScore,
          contextScore,
        }
      })
      .sort((a, b) => b.priority - a.priority)
  }

  // Helper methods
  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0)
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0)

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  private static isPromptUsedRecently(prompt: string, usedPrompts: Set<string>): boolean {
    const promptStart = prompt.substring(0, 50)
    return usedPrompts.has(promptStart)
  }
}
