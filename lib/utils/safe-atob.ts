/**
 * Safe Base64 decoding utility
 * Prevents crashes when decoding malformed Base64 strings
 */

export function safeAtob(str: string): string | null {
  try {
    // Basic validation - check if string looks like Base64
    if (!str || typeof str !== "string") {
      return null
    }

    // Remove whitespace and check basic Base64 pattern
    const cleaned = str.replace(/\s/g, "")
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
      return null
    }

    // Attempt to decode
    return atob(cleaned)
  } catch (error) {
    console.warn("Failed to decode Base64 string:", error)
    return null
  }
}

export function safeBtoa(str: string): string | null {
  try {
    if (!str || typeof str !== "string") {
      return null
    }
    return btoa(str)
  } catch (error) {
    console.warn("Failed to encode Base64 string:", error)
    return null
  }
}

export function isValidBase64(str: string): boolean {
  if (!str || typeof str !== "string") {
    return false
  }

  try {
    const cleaned = str.replace(/\s/g, "")
    return /^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) && btoa(atob(cleaned)) === cleaned
  } catch {
    return false
  }
}
