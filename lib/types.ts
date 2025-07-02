export interface Profile {
  name?: string
  age: number | string
  height: string
  weight: string
}

export interface Stats {
  MIND: number
  BODY: number
  SPIRIT: number
  WORK: number
  PLAY: number
}

export interface FloatingXP {
  id: string
  stat: string
  amount: number
  timestamp: number
}

export interface DailyLog {
  date: string
  mood: number
  energy: number
  sleep: number
  challenges: string
  focus: string
}

export interface Habit {
  id: string
  name: string
  streak: number
  completionHistory: string[]
  lastCompleted?: string
  highestStreak?: number
  category?: "health" | "productivity" | "mindfulness" | "social"
  difficulty?: "easy" | "medium" | "hard"
}

export interface JournalEntry {
  id: string
  date: string
  content: string
  mood: number
  tags: string[]
  emotionalState?: number
  aiResponse?: string
  isAIGuided?: boolean
}

export interface Achievement {
  id: string
  date: string
  milestone: string
  reflection: string
  category: string
}

export interface ActionPlan {
  id: string
  date: string
  strategies: string[]
  outcomes: string[]
}

export interface Mission {
  id: string
  title: string
  description: string
  stat: keyof Stats
  xpReward: number
  completed: boolean
  difficulty: "easy" | "medium" | "hard"
  isAIGenerated?: boolean
  category?: string
}

export interface MotivationalContent {
  type: "quote" | "affirmation" | "future-self" | "win"
  content: string
  author?: string
}

export interface CheckInData {
  id: string
  date: string
  mood: number
  energy: number
  emoji?: string
  notes?: string
  timestamp?: string
  topPriority?: string
  concerns?: string
  gratitude?: string
}

export interface UserData {
  dailyLogs: DailyLog[]
  habits: Habit[]
  journal: JournalEntry[]
  achievements: Achievement[]
  actionPlans: ActionPlan[]
  checkIns: CheckInData[]
  lastActive: string
  totalXP?: number
  level?: number
  unlockedThemes?: string[]
  preferredCheckInTime?: string
  lastCheckInDate?: string
}

export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
  xpReward: number
  priority?: "low" | "medium" | "high"
  category?: string
  dueDate?: string
}

export interface StreakData {
  name: string
  current: number
  highest: number
  lastUpdate: string
}

// Smart Goal Types
export interface SmartGoal {
  id: string
  title: string
  description: string
  category: keyof Stats
  targetValue: number
  currentValue: number
  deadline: string
  priority: "low" | "medium" | "high"
  status: "active" | "completed" | "paused"
  createdAt: string
  milestones: GoalMilestone[]
}

export interface GoalMilestone {
  id: string
  title: string
  targetValue: number
  completed: boolean
  completedAt?: string
}

// Component Props
export interface ProfilePanelProps {
  profile: Profile
}

export interface TodoPanelProps {
  todos: Todo[]
  onAddTodo: (text: string) => void
  onCompleteTodo: (id: string) => void
  onDeleteTodo: (id: string) => void
  checkIns: CheckInData[]
  stats: Stats
}
