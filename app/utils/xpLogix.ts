export const XP_PER_LEVEL = 500

export function calculateTotalXP(stats: {
  MIND: number
  BODY: number
  SPIRIT: number
  WORK: number
  PLAY: number
}): number {
  return stats.MIND + stats.BODY + stats.SPIRIT + stats.WORK + stats.PLAY
}

export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1
}

export function getXPForNextLevel(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP)
  return currentLevel * XP_PER_LEVEL - totalXP
}

export function getLevelProgress(totalXP: number): number {
  const xpInCurrentLevel = totalXP % XP_PER_LEVEL
  return (xpInCurrentLevel / XP_PER_LEVEL) * 100
}

export function getStatMultiplier(stat: string, level: number): number {
  // Higher levels give bonus XP multipliers
  const baseMultiplier = 1
  const levelBonus = Math.floor(level / 5) * 0.1
  return baseMultiplier + levelBonus
}

export function calculateXPReward(
  baseXP: number,
  level: number,
  difficulty: "easy" | "medium" | "hard" = "medium",
): number {
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  }

  const levelMultiplier = getStatMultiplier("", level)
  return Math.round(baseXP * difficultyMultiplier[difficulty] * levelMultiplier)
}
