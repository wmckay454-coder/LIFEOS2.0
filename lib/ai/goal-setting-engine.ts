import type { Stats, JournalEntry, CheckInData, Habit, Todo } from "@/lib/types"

export interface SmartGoal {
  id: string
  title: string
  description: string
  category: "health" | "productivity" | "learning" | "social" | "financial"
  priority: "low" | "medium" | "high"
  targetValue?: number
  unit?: string
  deadline?: Date
  milestones: string[]
  aiGenerated: boolean
}

export interface Milestone {
  id: string
  title: string
  targetValue: number
  targetDate: string
  completed: boolean
  completedAt?: string
}

export interface Strategy {
  id: string
  title: string
  description: string
  type: "habit" | "action" | "mindset" | "environment"
  frequency: "daily" | "weekly" | "as-needed"
  estimatedImpact: number
  difficulty: "easy" | "medium" | "hard"
}

export interface GoalProgress {
  goalId: string
  progressPercentage: number
  trend: "improving" | "stable" | "declining"
  daysRemaining: number
  projectedCompletion: "on-track" | "ahead" | "behind" | "at-risk"
  nextMilestone?: Milestone
  recommendations: string[]
}

export interface GoalRecommendation {
  goal: SmartGoal
  reasoning: string
  confidence: number
  basedOn: string[]
}

export class GoalSettingEngine {
  // Analyze user data and suggest personalized goals
  static generateSmartGoals(
    stats: Stats,
    journalEntries: JournalEntry[],
    checkIns: CheckInData[],
    habits: Habit[],
    todos: Todo[],
    userPreferences: {
      focusAreas: string[]
      timeCommitment: "low" | "medium" | "high"
      preferredDifficulty: "easy" | "medium" | "hard"
      motivationStyle: "achievement" | "progress" | "social" | "intrinsic"
    },
  ): SmartGoal[] {
    const goals: SmartGoal[] = []
    const now = new Date()

    // Analyze current state and identify improvement areas
    const improvementAreas = this.identifyImprovementAreas(stats, checkIns, habits)
    const userPatterns = this.analyzeUserPatterns(journalEntries, checkIns, habits)

    // Generate stat-based goals
    improvementAreas.forEach((area) => {
      const goal = this.createStatGoal(area, stats, userPreferences, now)
      if (goal) goals.push(goal)
    })

    // Generate wellness goals based on patterns
    const wellnessGoals = this.createWellnessGoals(userPatterns, checkIns, userPreferences, now)
    goals.push(...wellnessGoals)

    // Generate habit-based goals
    const habitGoals = this.createHabitGoals(habits, userPreferences, now)
    goals.push(...habitGoals)

    // Generate productivity goals
    const productivityGoals = this.createProductivityGoals(todos, stats, userPreferences, now)
    goals.push(...productivityGoals)

    return goals
      .sort((a, b) => {
        const priorityOrder = { low: 1, medium: 2, high: 3 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      .slice(0, 6) // Limit to top 6 goals to avoid overwhelm
  }

  // Track progress for existing goals
  static trackGoalProgress(goals: SmartGoal[], stats: Stats, checkIns: CheckInData[], habits: Habit[]): GoalProgress[] {
    return goals.map((goal) => {
      const progress = this.calculateGoalProgress(goal, stats, checkIns, habits)
      const trend = this.calculateProgressTrend(goal, stats, checkIns, habits)
      const projectedCompletion = this.projectCompletion(goal, progress, trend)
      const recommendations = this.generateProgressRecommendations(goal, progress, trend)

      return {
        goalId: goal.id,
        progressPercentage: progress,
        trend,
        daysRemaining: this.calculateDaysRemaining(goal),
        projectedCompletion,
        nextMilestone: this.getNextMilestone(goal),
        recommendations,
      }
    })
  }

  // Update goals based on progress and changing circumstances
  static adaptGoals(
    goals: SmartGoal[],
    progressData: GoalProgress[],
    recentCheckIns: CheckInData[],
    userFeedback?: { goalId: string; feedback: "too_easy" | "too_hard" | "not_relevant" | "perfect" }[],
  ): SmartGoal[] {
    return goals.map((goal) => {
      const progress = progressData.find((p) => p.goalId === goal.id)
      const feedback = userFeedback?.find((f) => f.goalId === goal.id)

      if (!progress) return goal

      const adaptedGoal = { ...goal }

      // Adapt based on progress
      if (progress.projectedCompletion === "ahead" && progress.progressPercentage > 80) {
        // Goal is too easy, increase target
        adaptedGoal.targetValue = Math.round(adaptedGoal.targetValue ? adaptedGoal.targetValue * 1.2 : 0)
        adaptedGoal.difficulty = adaptedGoal.difficulty === "easy" ? "medium" : "hard"
      } else if (progress.projectedCompletion === "at-risk" && progress.progressPercentage < 30) {
        // Goal might be too ambitious, adjust
        adaptedGoal.targetValue = Math.round(adaptedGoal.targetValue ? adaptedGoal.targetValue * 0.8 : 0)
        adaptedGoal.difficulty = adaptedGoal.difficulty === "hard" ? "medium" : "easy"
      }

      // Adapt based on user feedback
      if (feedback) {
        switch (feedback.feedback) {
          case "too_easy":
            adaptedGoal.targetValue = Math.round(adaptedGoal.targetValue ? adaptedGoal.targetValue * 1.3 : 0)
            adaptedGoal.difficulty = "hard"
            break
          case "too_hard":
            adaptedGoal.targetValue = Math.round(adaptedGoal.targetValue ? adaptedGoal.targetValue * 0.7 : 0)
            adaptedGoal.difficulty = "easy"
            break
          case "not_relevant":
            adaptedGoal.priority =
              adaptedGoal.priority === "low" ? "low" : adaptedGoal.priority === "medium" ? "low" : "medium"
            break
        }
      }

      // Update milestones if target changed
      if (adaptedGoal.targetValue !== goal.targetValue) {
        adaptedGoal.milestones = this.generateMilestones(adaptedGoal)
      }

      return adaptedGoal
    })
  }

  // Analyze user data and suggest personalized goals
  static analyzeUserData(userData: any): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = []

    // Analyze check-ins for mood patterns
    if (userData.checkIns && userData.checkIns.length > 0) {
      const avgMood =
        userData.checkIns.reduce((sum: number, checkin: any) => sum + checkin.mood, 0) / userData.checkIns.length

      if (avgMood < 6) {
        recommendations.push({
          goal: {
            id: `mood-improvement-${Date.now()}`,
            title: "Improve Daily Mood",
            description: "Focus on activities that boost your emotional well-being",
            category: "health",
            priority: "high",
            targetValue: 8,
            unit: "mood score",
            milestones: [
              "Practice daily meditation for 10 minutes",
              "Maintain a gratitude journal",
              "Engage in physical activity 3x per week",
            ],
            aiGenerated: true,
          },
          reasoning:
            "Your recent mood scores indicate room for improvement. Focusing on mood-boosting activities could significantly enhance your well-being.",
          confidence: 0.85,
          basedOn: ["mood_patterns", "check_in_data"],
        })
      }
    }

    // Analyze habits for consistency
    if (userData.habits && userData.habits.length > 0) {
      const inconsistentHabits = userData.habits.filter(
        (habit: any) => habit.streak < 7 && habit.completedDates.length > 0,
      )

      if (inconsistentHabits.length > 0) {
        recommendations.push({
          goal: {
            id: `habit-consistency-${Date.now()}`,
            title: "Build Consistent Habits",
            description: "Strengthen your habit formation and maintain longer streaks",
            category: "productivity",
            priority: "medium",
            targetValue: 21,
            unit: "day streak",
            milestones: [
              "Achieve 7-day streak on 2 habits",
              "Reach 14-day streak on 1 habit",
              "Maintain 21-day streak",
            ],
            aiGenerated: true,
          },
          reasoning:
            "You have several habits with broken streaks. Focusing on consistency could help establish stronger routines.",
          confidence: 0.75,
          basedOn: ["habit_patterns", "streak_analysis"],
        })
      }
    }

    // Analyze todos for productivity
    if (userData.todos && userData.todos.length > 0) {
      const completionRate = userData.todos.filter((todo: any) => todo.completed).length / userData.todos.length

      if (completionRate < 0.7) {
        recommendations.push({
          goal: {
            id: `productivity-boost-${Date.now()}`,
            title: "Increase Task Completion Rate",
            description: "Improve your productivity and task management skills",
            category: "productivity",
            priority: "medium",
            targetValue: 85,
            unit: "completion rate %",
            milestones: [
              "Complete 75% of daily tasks for 1 week",
              "Achieve 80% completion rate for 2 weeks",
              "Maintain 85% completion rate",
            ],
            aiGenerated: true,
          },
          reasoning:
            "Your current task completion rate suggests there's room for improvement in productivity and time management.",
          confidence: 0.7,
          basedOn: ["todo_completion", "productivity_metrics"],
        })
      }
    }

    return recommendations
  }

  // Generate personalized goals based on user preferences and current goals
  static generatePersonalizedGoals(userPreferences: any, currentGoals: SmartGoal[]): SmartGoal[] {
    const suggestions: SmartGoal[] = []

    // Generate based on missing categories
    const existingCategories = currentGoals.map((g) => g.category)
    const allCategories: SmartGoal["category"][] = ["health", "productivity", "learning", "social", "financial"]

    const missingCategories = allCategories.filter((cat) => !existingCategories.includes(cat))

    missingCategories.forEach((category) => {
      suggestions.push({
        id: `suggested-${category}-${Date.now()}`,
        title: this.getCategoryGoalTitle(category),
        description: this.getCategoryGoalDescription(category),
        category,
        priority: "low",
        milestones: [],
        aiGenerated: true,
        reasoning: `Suggested to maintain balance across all life areas`,
      })
    })

    return suggestions
  }

  // Generate a custom goal based on user input
  static createCustomGoal(title: string, description: string, category: SmartGoal["category"]): SmartGoal {
    return {
      id: `custom-${Date.now()}`,
      title,
      description,
      category,
      priority: "medium",
      milestones: [],
      aiGenerated: false,
    }
  }

  // Private helper methods
  private static identifyImprovementAreas(
    stats: Stats,
    checkIns: CheckInData[],
    habits: Habit[],
  ): Array<{ stat: keyof Stats; priority: number; reason: string }> {
    const areas: Array<{ stat: keyof Stats; priority: number; reason: string }> = []
    const totalXP = Object.values(stats).reduce((sum, val) => sum + val, 0)
    const avgXP = totalXP / Object.keys(stats).length

    Object.entries(stats).forEach(([statName, value]) => {
      const stat = statName as keyof Stats
      const percentageOfAvg = avgXP > 0 ? (value / avgXP) * 100 : 100

      if (percentageOfAvg < 70) {
        areas.push({
          stat,
          priority: percentageOfAvg < 50 ? 10 : 7,
          reason: `${stat} is ${Math.round(100 - percentageOfAvg)}% below your average`,
        })
      }
    })

    return areas.sort((a, b) => b.priority - a.priority)
  }

  private static analyzeUserPatterns(
    journalEntries: JournalEntry[],
    checkIns: CheckInData[],
    habits: Habit[],
  ): {
    averageMood: number
    moodTrend: number
    averageEnergy: number
    energyTrend: number
    stressIndicators: string[]
    positivePatterns: string[]
  } {
    const recentCheckIns = checkIns.slice(-14) // Last 2 weeks
    const recentEntries = journalEntries.slice(-7) // Last week

    const averageMood =
      recentCheckIns.length > 0 ? recentCheckIns.reduce((sum, c) => sum + c.mood, 0) / recentCheckIns.length : 5

    const averageEnergy =
      recentCheckIns.length > 0 ? recentCheckIns.reduce((sum, c) => sum + c.energy, 0) / recentCheckIns.length : 5

    const moodTrend = this.calculateTrend(recentCheckIns.map((c) => c.mood))
    const energyTrend = this.calculateTrend(recentCheckIns.map((c) => c.energy))

    // Analyze journal for stress indicators and positive patterns
    const allText = recentEntries.map((e) => e.entry.toLowerCase()).join(" ")

    const stressKeywords = ["stressed", "anxious", "overwhelmed", "pressure", "worried", "tired"]
    const positiveKeywords = ["grateful", "happy", "accomplished", "excited", "peaceful", "confident"]

    const stressIndicators = stressKeywords.filter((keyword) => allText.includes(keyword))
    const positivePatterns = positiveKeywords.filter((keyword) => allText.includes(keyword))

    return {
      averageMood,
      moodTrend,
      averageEnergy,
      energyTrend,
      stressIndicators,
      positivePatterns,
    }
  }

  private static createStatGoal(
    area: { stat: keyof Stats; priority: number; reason: string },
    stats: Stats,
    preferences: any,
    now: Date,
  ): SmartGoal | null {
    const currentValue = stats[area.stat]
    const targetIncrease =
      preferences.preferredDifficulty === "easy" ? 50 : preferences.preferredDifficulty === "medium" ? 100 : 150

    const goal: SmartGoal = {
      id: `stat_${area.stat.toLowerCase()}_${now.getTime()}`,
      title: `Boost Your ${area.stat} Development`,
      description: `Increase your ${area.stat} stat through targeted activities and habits`,
      category:
        area.stat === "MIND"
          ? "learning"
          : area.stat === "BODY"
            ? "health"
            : area.stat === "SPIRIT"
              ? "mindfulness"
              : area.stat === "WORK"
                ? "productivity"
                : "social",
      priority:
        preferences.timeCommitment === "low" ? "low" : preferences.timeCommitment === "medium" ? "medium" : "high",
      targetValue: currentValue + targetIncrease,
      unit: "XP",
      deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      milestones: [],
      aiGenerated: true,
      reasoning: area.reason,
    }

    goal.milestones = this.generateMilestones(goal)
    return goal
  }

  private static createWellnessGoals(patterns: any, checkIns: CheckInData[], preferences: any, now: Date): SmartGoal[] {
    const goals: SmartGoal[] = []

    // Mood improvement goal if needed
    if (patterns.averageMood < 6) {
      goals.push({
        id: `wellness_mood_${now.getTime()}`,
        title: "Improve Daily Mood",
        description: "Increase your average daily mood through mindfulness and positive activities",
        category: "health",
        priority:
          preferences.timeCommitment === "low" ? "low" : preferences.timeCommitment === "medium" ? "medium" : "high",
        targetValue: Math.min(8, patterns.averageMood + 2),
        unit: "mood rating",
        deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        milestones: [],
        aiGenerated: true,
        reasoning: `Your average mood is ${patterns.averageMood.toFixed(1)}/10 - this goal will help you feel better consistently`,
      })
    }

    // Energy improvement goal if needed
    if (patterns.averageEnergy < 6) {
      goals.push({
        id: `wellness_energy_${now.getTime()}`,
        title: "Boost Energy Levels",
        description: "Increase your daily energy through better habits and self-care",
        category: "health",
        priority:
          preferences.timeCommitment === "low" ? "low" : preferences.timeCommitment === "medium" ? "medium" : "high",
        targetValue: Math.min(8, patterns.averageEnergy + 2),
        unit: "energy rating",
        deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        milestones: [],
        aiGenerated: true,
        reasoning: `Your average energy is ${patterns.averageEnergy.toFixed(1)}/10 - improving this will enhance your overall well-being`,
      })
    }

    goals.forEach((goal) => {
      goal.milestones = this.generateMilestones(goal)
    })

    return goals
  }

  private static createHabitGoals(habits: Habit[], preferences: any, now: Date): SmartGoal[] {
    const goals: SmartGoal[] = []

    // Calculate current habit completion rate
    const today = new Date().toDateString()
    const completedToday = habits.filter((h) => h.completionHistory.includes(today)).length
    const currentRate = habits.length > 0 ? (completedToday / habits.length) * 100 : 100

    if (currentRate < 80 && habits.length > 0) {
      goals.push({
        id: `habits_consistency_${now.getTime()}`,
        title: "Master Habit Consistency",
        description: "Achieve consistent daily habit completion",
        category: "productivity",
        priority:
          preferences.timeCommitment === "low" ? "low" : preferences.timeCommitment === "medium" ? "medium" : "high",
        targetValue: 85,
        unit: "% completion",
        deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        milestones: [],
        aiGenerated: true,
        reasoning: `Your current habit completion rate is ${Math.round(currentRate)}% - improving consistency will accelerate your growth`,
      })
    }

    goals.forEach((goal) => {
      goal.milestones = this.generateMilestones(goal)
    })

    return goals
  }

  private static createProductivityGoals(todos: Todo[], stats: Stats, preferences: any, now: Date): SmartGoal[] {
    const goals: SmartGoal[] = []

    // Analyze todo completion patterns
    const completedTodos = todos.filter((t) => t.completed)
    const activeTodos = todos.filter((t) => !t.completed)

    if (activeTodos.length > 10) {
      goals.push({
        id: `productivity_tasks_${now.getTime()}`,
        title: "Master Task Management",
        description: "Reduce task backlog and improve completion rate",
        category: "productivity",
        priority:
          preferences.timeCommitment === "low" ? "low" : preferences.timeCommitment === "medium" ? "medium" : "high",
        targetValue: Math.max(5, activeTodos.length - 5),
        unit: "active tasks",
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        milestones: [],
        aiGenerated: true,
        reasoning: `You have ${activeTodos.length} active tasks - reducing this backlog will decrease stress and increase focus`,
      })
    }

    goals.forEach((goal) => {
      goal.milestones = this.generateMilestones(goal)
    })

    return goals
  }

  private static generateMilestones(goal: SmartGoal): string[] {
    const milestones: string[] = []
    const totalProgress = goal.targetValue ? goal.targetValue - (goal.currentValue || 0) : 0
    const timeframe = this.getTimeframeInDays(
      goal.deadline ? new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime() : 30 * 24 * 60 * 60 * 1000,
    )

    // Create 3-4 milestones
    const milestoneCount = 3
    for (let i = 1; i <= milestoneCount; i++) {
      const progressPercentage = i / milestoneCount
      const milestoneValue = goal.currentValue ? goal.currentValue + totalProgress * progressPercentage : 0
      const milestoneDate = new Date(Date.now() + timeframe * progressPercentage)

      milestones.push(`Reach ${Math.round(milestoneValue)} ${goal.unit} by ${milestoneDate.toISOString()}`)
    }

    return milestones
  }

  private static calculateGoalProgress(
    goal: SmartGoal,
    stats: Stats,
    checkIns: CheckInData[],
    habits: Habit[],
  ): number {
    switch (goal.category) {
      case "health":
        if (goal.category in stats) {
          const currentValue = stats[goal.category as keyof Stats]
          const progress =
            ((currentValue - (goal.currentValue || 0)) /
              (goal.targetValue ? goal.targetValue - (goal.currentValue || 0) : 1)) *
            100
          return Math.max(0, Math.min(100, progress))
        }
        break
      case "productivity":
        // Calculate based on habit completion
        const today = new Date().toDateString()
        const relevantHabits = habits.filter((h) => h.name.toLowerCase().includes("habit"))
        if (relevantHabits.length > 0) {
          const completedToday = relevantHabits.filter((h) => h.completionHistory.includes(today)).length
          return (completedToday / relevantHabits.length) * 100
        }
        break
    }
    return 0
  }

  private static calculateProgressTrend(
    goal: SmartGoal,
    stats: Stats,
    checkIns: CheckInData[],
    habits: Habit[],
  ): "improving" | "stable" | "declining" {
    // Simplified trend calculation - in a real implementation, this would analyze historical data
    const currentProgress = this.calculateGoalProgress(goal, stats, checkIns, habits)

    if (currentProgress > 60) return "improving"
    if (currentProgress > 30) return "stable"
    return "declining"
  }

  private static projectCompletion(
    goal: SmartGoal,
    progress: number,
    trend: "improving" | "stable" | "declining",
  ): "on-track" | "ahead" | "behind" | "at-risk" {
    const daysRemaining = this.calculateDaysRemaining(goal)
    const timeElapsed = this.getTimeframeInDays(
      goal.deadline ? new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime() : 30 * 24 * 60 * 60 * 1000,
    )
    const expectedProgress =
      (timeElapsed /
        this.getTimeframeInDays(
          goal.deadline
            ? new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime()
            : 30 * 24 * 60 * 60 * 1000,
        )) *
      100

    if (progress > expectedProgress + 20) return "ahead"
    if (progress > expectedProgress - 10) return "on-track"
    if (progress > expectedProgress - 30) return "behind"
    return "at-risk"
  }

  private static generateProgressRecommendations(
    goal: SmartGoal,
    progress: number,
    trend: "improving" | "stable" | "declining",
  ): string[] {
    const recommendations: string[] = []

    if (trend === "declining") {
      recommendations.push("Consider breaking down the goal into smaller, more manageable steps")
      recommendations.push("Review what obstacles are preventing progress")
      recommendations.push("Try focusing on just one strategy at a time")
    } else if (trend === "stable" && progress < 50) {
      recommendations.push("Increase consistency with daily actions")
      recommendations.push("Set up environmental cues to support your goal")
      recommendations.push("Track your progress more frequently for motivation")
    } else if (trend === "improving") {
      recommendations.push("Great momentum! Keep up the current strategies")
      recommendations.push("Consider sharing your progress with others for accountability")
      recommendations.push("Prepare for potential obstacles to maintain progress")
    }

    return recommendations
  }

  private static calculateDaysRemaining(goal: SmartGoal): number {
    const targetDate = new Date(goal.deadline || "")
    const now = new Date()
    const diffTime = targetDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  private static getNextMilestone(goal: SmartGoal): Milestone | undefined {
    // Placeholder for finding the next milestone
    return undefined
  }

  private static getTimeframeInDays(timeframe: number): number {
    return timeframe / (24 * 60 * 60 * 1000)
  }

  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0

    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0)
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0)

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  private static getCategoryGoalTitle(category: SmartGoal["category"]): string {
    const titles = {
      health: "Improve Physical Health",
      productivity: "Boost Daily Productivity",
      learning: "Learn Something New",
      social: "Strengthen Social Connections",
      financial: "Manage Finances Better",
    }
    return titles[category]
  }

  private static getCategoryGoalDescription(category: SmartGoal["category"]): string {
    const descriptions = {
      health: "Focus on exercise, nutrition, and physical well-being",
      productivity: "Optimize your daily workflow and task completion",
      learning: "Dedicate time to acquiring new skills or knowledge",
      social: "Invest time in meaningful connections with others",
      financial: "Improve your financial literacy and manage your money better",
    }
    return descriptions[category]
  }
}
