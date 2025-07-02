export interface ContextualRecommendation {
  id: string
  title: string
  description: string
  type: "activity" | "habit" | "mindfulness" | "productivity" | "health"
  duration?: number
  context: string[]
  priority: number
}

interface RecommendationContext {
  timeOfDay: "morning" | "afternoon" | "evening" | "night"
  mood?: number
  energy?: number
  recentActivities: string[]
  userPreferences: Record<string, any>
  currentGoals: any[]
}

export class ContextualRecommendationEngine {
  static generateRecommendations(context: RecommendationContext): ContextualRecommendation[] {
    const recommendations: ContextualRecommendation[] = []

    // Time-based recommendations
    switch (context.timeOfDay) {
      case "morning":
        recommendations.push({
          id: "morning-routine",
          title: "Morning Energizer",
          description: "Start your day with a quick workout or stretching session",
          type: "activity",
          duration: 15,
          context: ["morning", "energy"],
          priority: 8,
        })
        break

      case "afternoon":
        recommendations.push({
          id: "afternoon-focus",
          title: "Focus Boost",
          description: "Take a 5-minute breathing break to reset your focus",
          type: "mindfulness",
          duration: 5,
          context: ["afternoon", "productivity"],
          priority: 7,
        })
        break

      case "evening":
        recommendations.push({
          id: "evening-reflection",
          title: "Daily Reflection",
          description: "Spend time journaling about your day and tomorrow's goals",
          type: "habit",
          duration: 10,
          context: ["evening", "reflection"],
          priority: 6,
        })
        break

      case "night":
        recommendations.push({
          id: "night-wind-down",
          title: "Wind Down Routine",
          description: "Practice relaxation techniques to prepare for better sleep",
          type: "mindfulness",
          duration: 20,
          context: ["night", "sleep"],
          priority: 9,
        })
        break
    }

    // Mood-based recommendations
    if (context.mood !== undefined) {
      if (context.mood < 5) {
        recommendations.push({
          id: "mood-boost",
          title: "Mood Booster",
          description: "Listen to uplifting music or call a friend",
          type: "activity",
          duration: 15,
          context: ["low-mood", "social"],
          priority: 9,
        })
      } else if (context.mood > 8) {
        recommendations.push({
          id: "maintain-mood",
          title: "Maintain Momentum",
          description: "Channel this positive energy into a productive task",
          type: "productivity",
          duration: 30,
          context: ["high-mood", "productivity"],
          priority: 7,
        })
      }
    }

    // Energy-based recommendations
    if (context.energy !== undefined) {
      if (context.energy < 4) {
        recommendations.push({
          id: "energy-restore",
          title: "Energy Restoration",
          description: "Take a power nap or do some light stretching",
          type: "health",
          duration: 20,
          context: ["low-energy", "rest"],
          priority: 8,
        })
      } else if (context.energy > 7) {
        recommendations.push({
          id: "energy-channel",
          title: "Channel High Energy",
          description: "Perfect time for a challenging workout or creative project",
          type: "activity",
          duration: 45,
          context: ["high-energy", "challenge"],
          priority: 8,
        })
      }
    }

    // Default recommendations if no specific context
    if (recommendations.length === 0) {
      recommendations.push(
        {
          id: "hydration-reminder",
          title: "Stay Hydrated",
          description: "Drink a glass of water and check your hydration levels",
          type: "health",
          duration: 2,
          context: ["general", "health"],
          priority: 5,
        },
        {
          id: "posture-check",
          title: "Posture Check",
          description: "Take a moment to adjust your posture and stretch",
          type: "health",
          duration: 3,
          context: ["general", "wellness"],
          priority: 4,
        },
      )
    }

    return recommendations.sort((a, b) => b.priority - a.priority)
  }
}
