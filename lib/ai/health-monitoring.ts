export interface HealthAlert {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "critical"
  recommendations: string[]
  timestamp: Date
}

export interface HealthMetrics {
  stressLevel: number
  sleepQuality: number
  activityLevel: number
  moodStability: number
  overallScore: number
}

export class HealthMonitoringService {
  static analyzeHealthPatterns(userData: any): HealthAlert[] {
    const alerts: HealthAlert[] = []

    // Analyze mood patterns
    if (userData.checkIns && userData.checkIns.length >= 7) {
      const recentCheckIns = userData.checkIns.slice(-7)
      const moodTrend = this.calculateTrend(recentCheckIns.map((c: any) => c.mood))

      if (moodTrend < -0.5) {
        alerts.push({
          id: "declining-mood",
          title: "Declining Mood Pattern Detected",
          message: "Your mood has been trending downward over the past week.",
          type: "warning",
          recommendations: [
            "Consider scheduling time for activities you enjoy",
            "Reach out to friends or family for social support",
            "Practice mindfulness or meditation",
            "Ensure you're getting adequate sleep",
          ],
          timestamp: new Date(),
        })
      }
    }

    // Analyze energy levels
    if (userData.checkIns && userData.checkIns.length >= 5) {
      const recentEnergy = userData.checkIns.slice(-5).map((c: any) => c.energy)
      const avgEnergy = recentEnergy.reduce((sum: number, e: number) => sum + e, 0) / recentEnergy.length

      if (avgEnergy < 4) {
        alerts.push({
          id: "low-energy",
          title: "Consistently Low Energy Levels",
          message: "Your energy levels have been below average recently.",
          type: "warning",
          recommendations: [
            "Review your sleep schedule and aim for 7-9 hours",
            "Check your nutrition and hydration",
            "Consider light exercise or movement",
            "Take breaks throughout your day",
          ],
          timestamp: new Date(),
        })
      }
    }

    // Analyze habit consistency
    if (userData.habits && userData.habits.length > 0) {
      const brokenStreaks = userData.habits.filter((h: any) => h.streak === 0 && h.completedDates.length > 0)

      if (brokenStreaks.length >= 3) {
        alerts.push({
          id: "habit-disruption",
          title: "Multiple Habit Streaks Broken",
          message: "Several of your habits have had their streaks reset recently.",
          type: "info",
          recommendations: [
            "Start with just one habit to rebuild momentum",
            "Set smaller, more achievable daily goals",
            "Use habit stacking to link new habits to existing routines",
            "Consider what might be causing the disruptions",
          ],
          timestamp: new Date(),
        })
      }
    }

    return alerts
  }

  static calculateHealthMetrics(userData: any): HealthMetrics {
    let stressLevel = 5
    let sleepQuality = 7
    let activityLevel = 6
    let moodStability = 7

    // Calculate stress level based on mood and energy
    if (userData.checkIns && userData.checkIns.length > 0) {
      const recent = userData.checkIns.slice(-7)
      const avgMood = recent.reduce((sum: number, c: any) => sum + c.mood, 0) / recent.length
      const avgEnergy = recent.reduce((sum: number, c: any) => sum + c.energy, 0) / recent.length

      // Lower mood and energy suggest higher stress
      stressLevel = Math.max(1, 10 - (avgMood + avgEnergy) / 2)

      // Sleep quality estimation based on energy levels
      sleepQuality = Math.min(10, avgEnergy + 1)

      // Mood stability calculation
      const moodVariance = this.calculateVariance(recent.map((c: any) => c.mood))
      moodStability = Math.max(1, 10 - moodVariance)
    }

    // Activity level based on habits
    if (userData.habits && userData.habits.length > 0) {
      const activeHabits = userData.habits.filter((h: any) => h.streak > 0).length
      const totalHabits = userData.habits.length
      activityLevel = Math.min(10, (activeHabits / totalHabits) * 10)
    }

    const overallScore = (stressLevel + sleepQuality + activityLevel + moodStability) / 4

    return {
      stressLevel,
      sleepQuality,
      activityLevel,
      moodStability,
      overallScore,
    }
  }

  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, index) => sum + index * val, 0)
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0)

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  }

  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
  }
}
