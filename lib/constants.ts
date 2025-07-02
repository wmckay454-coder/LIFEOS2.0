import type { Mission, Habit } from "@/lib/types"

export const defaultStats = {
  MIND: 0,
  BODY: 0,
  SPIRIT: 0,
  WORK: 0,
  PLAY: 0,
}

// Human-readable explanations for each stat
export const statDescriptions = {
  MIND: "Knowledge, learning, creativity, and mental clarity",
  BODY: "Physical health, fitness, energy, and vitality",
  SPIRIT: "Inner peace, mindfulness, gratitude, and emotional well-being",
  WORK: "Productivity, career growth, skills, and professional achievements",
  PLAY: "Fun, recreation, hobbies, and life enjoyment",
} as const

export const defaultHabits: Habit[] = [
  {
    id: "habit_1",
    name: "Morning Meditation",
    streak: 0,
    completionHistory: [],
    category: "mindfulness",
    difficulty: "easy",
  },
  {
    id: "habit_2",
    name: "Daily Exercise",
    streak: 0,
    completionHistory: [],
    category: "health",
    difficulty: "medium",
  },
  {
    id: "habit_3",
    name: "Read for 30 minutes",
    streak: 0,
    completionHistory: [],
    category: "productivity",
    difficulty: "easy",
  },
  {
    id: "habit_4",
    name: "Drink 8 glasses of water",
    streak: 0,
    completionHistory: [],
    category: "health",
    difficulty: "easy",
  },
  {
    id: "habit_5",
    name: "Practice gratitude",
    streak: 0,
    completionHistory: [],
    category: "mindfulness",
    difficulty: "easy",
  },
]

export const dailyChallenges: Omit<Mission, "id" | "completed">[] = [
  {
    title: "Morning Mindfulness",
    description: "Start your day with 10 minutes of meditation or deep breathing",
    stat: "SPIRIT",
    xpReward: 25,
    difficulty: "easy",
    category: "wellness",
  },
  {
    title: "Learn Something New",
    description: "Read an article, watch a tutorial, or explore a new topic",
    stat: "MIND",
    xpReward: 30,
    difficulty: "medium",
    category: "growth",
  },
  {
    title: "Physical Activity",
    description: "Get your body moving for at least 20 minutes",
    stat: "BODY",
    xpReward: 35,
    difficulty: "medium",
    category: "fitness",
  },
  {
    title: "Complete Important Task",
    description: "Finish a high-priority item on your work or personal list",
    stat: "WORK",
    xpReward: 40,
    difficulty: "hard",
    category: "productivity",
  },
  {
    title: "Creative Expression",
    description: "Engage in art, music, writing, or any creative activity",
    stat: "PLAY",
    xpReward: 20,
    difficulty: "easy",
    category: "creativity",
  },
  {
    title: "Connect with Others",
    description: "Have a meaningful conversation or help someone",
    stat: "SPIRIT",
    xpReward: 25,
    difficulty: "medium",
    category: "social",
  },
  {
    title: "Organize Your Space",
    description: "Clean and organize your workspace or living area",
    stat: "WORK",
    xpReward: 30,
    difficulty: "medium",
    category: "organization",
  },
  {
    title: "Practice a Skill",
    description: "Spend time improving a skill you're learning",
    stat: "MIND",
    xpReward: 35,
    difficulty: "medium",
    category: "skill-building",
  },
  {
    title: "Enjoy Nature",
    description: "Spend time outdoors or with plants/natural elements",
    stat: "BODY",
    xpReward: 20,
    difficulty: "easy",
    category: "nature",
  },
  {
    title: "Plan Tomorrow",
    description: "Set intentions and priorities for the next day",
    stat: "WORK",
    xpReward: 15,
    difficulty: "easy",
    category: "planning",
  },
]

export const motivationalQuotes = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    type: "motivation",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    type: "perseverance",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    type: "dreams",
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
    type: "hope",
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    type: "action",
  },
]

// Mood scale used across the dashboard (1 - 10)
export const moodEmojis = [
  { value: 1, emoji: "😢", label: "Very Sad" },
  { value: 2, emoji: "😔", label: "Sad" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Happy" },
  { value: 6, emoji: "😄", label: "Very Happy" },
  { value: 7, emoji: "🤩", label: "Ecstatic" },
] as const

export const statColors = {
  MIND: "#8b5cf6", // Purple
  BODY: "#ef4444", // Red
  SPIRIT: "#06b6d4", // Cyan
  WORK: "#f59e0b", // Amber
  PLAY: "#10b981", // Emerald
}

export const difficultyColors = {
  easy: "#10b981", // Green
  medium: "#f59e0b", // Amber
  hard: "#ef4444", // Red
}
