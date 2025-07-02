import type { CheckInData, JournalEntry } from "@/lib/types"

export interface MoodPattern {
  id: string
  type: "daily" | "weekly" | "seasonal" | "trigger-based"
  pattern: string
  confidence: number
  description: string
  triggers?: string[]
  timeframe?: string
}

export interface MoodPrediction {
  date: string
  predictedMood: number
  confidence: number
  factors: string[]
  recommendations: string[]
  riskLevel: "low" | "medium" | "high"
}

export interface PreventativeAction {
  id: string
  title: string
  description: string
  type: "immediate" | "daily" | "weekly"
  difficulty: "easy" | "medium" | "hard"
  effectiveness: number
  category: "physical" | "mental" | "social" | "spiritual"
}

export class MoodPredictionEngine {
  static analyzeMoodPatterns(checkIns: CheckInData[], journalEntries: JournalEntry[]): MoodPattern[] {
    const patterns: MoodPattern[] = []

    // Daily patterns
    const dailyPattern = this.analyzeDailyPattern(checkIns)
    if (dailyPattern) patterns.push(dailyPattern)

    // Weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern(checkIns)
    if (weeklyPattern) patterns.push(weeklyPattern)

    // Trigger-based patterns
    const triggerPatterns = this.analyzeTriggerPatterns(checkIns, journalEntries)
    patterns.push(...triggerPatterns)

    return patterns
  }

  private static analyzeDailyPattern(checkIns: CheckInData[]): MoodPattern | null {
    if (checkIns.length < 7) return null

    const hourlyMoods: { [hour: number]: number[] } = {}

    checkIns.forEach((checkIn) => {
      const hour = new Date(checkIn.date).getHours()
      if (!hourlyMoods[hour]) hourlyMoods[hour] = []
      hourlyMoods[hour].push(checkIn.mood)
    })

    // Find the hour with most consistent low moods
    let worstHour = -1
    let worstAverage = 10

    Object.entries(hourlyMoods).forEach(([hour, moods]) => {
      if (moods.length >= 3) {
        const average = moods.reduce((a, b) => a + b, 0) / moods.length
        if (average < worstAverage) {
          worstAverage = average
          worstHour = Number.parseInt(hour)
        }
      }
    })

    if (worstHour !== -1 && worstAverage < 6) {
      return {
        id: "daily-low",
        type: "daily",
        pattern: `Low mood typically occurs around ${worstHour}:00`,
        confidence: 0.7,
        description: `Your mood tends to dip around ${worstHour}:00. This could be due to energy levels, routine, or external factors.`,
        timeframe: `${worstHour}:00 - ${worstHour + 2}:00`,
      }
    }

    return null
  }

  private static analyzeWeeklyPattern(checkIns: CheckInData[]): MoodPattern | null {
    if (checkIns.length < 14) return null

    const weeklyMoods: { [day: number]: number[] } = {}

    checkIns.forEach((checkIn) => {
      const day = new Date(checkIn.date).getDay()
      if (!weeklyMoods[day]) weeklyMoods[day] = []
      weeklyMoods[day].push(checkIn.mood)
    })

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    let worstDay = -1
    let worstAverage = 10

    Object.entries(weeklyMoods).forEach(([day, moods]) => {
      if (moods.length >= 2) {
        const average = moods.reduce((a, b) => a + b, 0) / moods.length
        if (average < worstAverage) {
          worstAverage = average
          worstDay = Number.parseInt(day)
        }
      }
    })

    if (worstDay !== -1 && worstAverage < 6) {
      return {
        id: "weekly-low",
        type: "weekly",
        pattern: `${dayNames[worstDay]}s tend to be challenging`,
        confidence: 0.6,
        description: `Your mood is consistently lower on ${dayNames[worstDay]}s. Consider planning self-care activities for this day.`,
        timeframe: dayNames[worstDay],
      }
    }

    return null
  }

  private static analyzeTriggerPatterns(checkIns: CheckInData[], journalEntries: JournalEntry[]): MoodPattern[] {
    const patterns: MoodPattern[] = []

    // Analyze journal entries for mood triggers
    const lowMoodEntries = journalEntries.filter((entry) => entry.mood <= 4)
    const commonWords = this.extractCommonWords(lowMoodEntries.map((e) => e.content))

    if (commonWords.length > 0) {
      patterns.push({
        id: "trigger-words",
        type: "trigger-based",
        pattern: `Mood drops when mentioning: ${commonWords.join(", ")}`,
        confidence: 0.5,
        description: "Certain topics or situations seem to correlate with lower mood.",
        triggers: commonWords,
      })
    }

    return patterns
  }

  private static extractCommonWords(texts: string[]): string[] {
    const words: { [word: string]: number } = {}
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "was",
      "are",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
    ])

    texts.forEach((text) => {
      const textWords = text.toLowerCase().match(/\b\w+\b/g) || []
      textWords.forEach((word) => {
        if (word.length > 3 && !stopWords.has(word)) {
          words[word] = (words[word] || 0) + 1
        }
      })
    })

    return Object.entries(words)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([word, _]) => word)
  }

  static predictMood(checkIns: CheckInData[], patterns: MoodPattern[], targetDate: Date): MoodPrediction {
    const factors: string[] = []
    let predictedMood = 7 // Default neutral-positive
    let confidence = 0.3
    const recommendations: string[] = []

    // Apply daily patterns
    const dailyPattern = patterns.find((p) => p.type === "daily")
    if (dailyPattern) {
      const hour = targetDate.getHours()
      const patternHour = Number.parseInt(dailyPattern.timeframe?.split(":")[0] || "0")

      if (Math.abs(hour - patternHour) <= 2) {
        predictedMood -= 1.5
        confidence += 0.2
        factors.push(`Daily low mood pattern (${dailyPattern.timeframe})`)
        recommendations.push("Schedule a mood-boosting activity during this time")
      }
    }

    // Apply weekly patterns
    const weeklyPattern = patterns.find((p) => p.type === "weekly")
    if (weeklyPattern) {
      const dayName = targetDate.toLocaleDateString("en-US", { weekday: "long" })
      if (weeklyPattern.timeframe === dayName) {
        predictedMood -= 1
        confidence += 0.15
        factors.push(`Weekly pattern: ${dayName}s are challenging`)
        recommendations.push("Plan extra self-care for this day")
      }
    }

    // Recent trend analysis
    if (checkIns.length >= 3) {
      const recentMoods = checkIns.slice(-3).map((c) => c.mood)
      const trend = this.calculateTrend(recentMoods)

      if (trend < -0.5) {
        predictedMood -= 0.5
        confidence += 0.1
        factors.push("Recent downward mood trend")
        recommendations.push("Consider reaching out to support network")
      } else if (trend > 0.5) {
        predictedMood += 0.5
        confidence += 0.1
        factors.push("Recent upward mood trend")
      }
    }

    // Ensure mood stays within bounds
    predictedMood = Math.max(1, Math.min(10, predictedMood))
    confidence = Math.min(0.9, confidence)

    const riskLevel: "low" | "medium" | "high" = predictedMood <= 3 ? "high" : predictedMood <= 5 ? "medium" : "low"

    if (riskLevel === "high") {
      recommendations.push("Consider professional support if mood remains low")
    }

    return {
      date: targetDate.toISOString(),
      predictedMood: Math.round(predictedMood * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      factors,
      recommendations,
      riskLevel,
    }
  }

  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    let trend = 0
    for (let i = 1; i < values.length; i++) {
      trend += values[i] - values[i - 1]
    }

    return trend / (values.length - 1)
  }

  static generatePreventativeActions(patterns: MoodPattern[], predictions: MoodPrediction[]): PreventativeAction[] {
    const actions: PreventativeAction[] = []

    // Base preventative actions
    const baseActions: PreventativeAction[] = [
      {
        id: "morning-routine",
        title: "Establish Morning Routine",
        description: "Start each day with a consistent, positive routine",
        type: "daily",
        difficulty: "easy",
        effectiveness: 0.7,
        category: "mental",
      },
      {
        id: "exercise",
        title: "Regular Exercise",
        description: "20-30 minutes of physical activity",
        type: "daily",
        difficulty: "medium",
        effectiveness: 0.8,
        category: "physical",
      },
      {
        id: "meditation",
        title: "Mindfulness Practice",
        description: "10 minutes of meditation or deep breathing",
        type: "daily",
        difficulty: "easy",
        effectiveness: 0.6,
        category: "spiritual",
      },
      {
        id: "social-connection",
        title: "Social Connection",
        description: "Reach out to a friend or family member",
        type: "weekly",
        difficulty: "easy",
        effectiveness: 0.7,
        category: "social",
      },
      {
        id: "nature-time",
        title: "Time in Nature",
        description: "Spend time outdoors, even if just 15 minutes",
        type: "daily",
        difficulty: "easy",
        effectiveness: 0.6,
        category: "physical",
      },
    ]

    actions.push(...baseActions)

    // Pattern-specific actions
    patterns.forEach((pattern) => {
      if (pattern.type === "daily" && pattern.timeframe) {
        actions.push({
          id: `daily-${pattern.id}`,
          title: "Pre-emptive Mood Boost",
          description: `Schedule a positive activity 1 hour before ${pattern.timeframe}`,
          type: "daily",
          difficulty: "easy",
          effectiveness: 0.5,
          category: "mental",
        })
      }

      if (pattern.type === "weekly" && pattern.timeframe) {
        actions.push({
          id: `weekly-${pattern.id}`,
          title: "Weekly Self-Care",
          description: `Plan something special for ${pattern.timeframe}`,
          type: "weekly",
          difficulty: "medium",
          effectiveness: 0.6,
          category: "mental",
        })
      }
    })

    // High-risk prediction actions
    const highRiskPredictions = predictions.filter((p) => p.riskLevel === "high")
    if (highRiskPredictions.length > 0) {
      actions.push({
        id: "crisis-plan",
        title: "Crisis Prevention Plan",
        description: "Create a plan for when mood drops significantly",
        type: "immediate",
        difficulty: "medium",
        effectiveness: 0.9,
        category: "mental",
      })
    }

    return actions
  }
}
