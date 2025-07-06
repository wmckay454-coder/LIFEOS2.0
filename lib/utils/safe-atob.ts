/**
 * Safely decode base64 strings without throwing errors
 */
export function safeAtob(str: string): string | null {
  try {
    // Check if string looks like base64
    if (!isProbablyBase64(str)) {
      return null
    }
    return atob(str)
  } catch (error) {
    console.warn("Failed to decode base64 string:", error)
    return null
  }
}

/**
 * Check if a string is likely to be base64 encoded
 */
export function isProbablyBase64(str: string): boolean {
  if (!str || typeof str !== "string") {
    return false
  }

  // Base64 strings should only contain these characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/

  // Should be divisible by 4 (with padding)
  const hasValidLength = str.length % 4 === 0

  // Should match base64 character set
  const hasValidChars = base64Regex.test(str)

  // Should be reasonably long (avoid false positives on short strings)
  const hasReasonableLength = str.length >= 4

  return hasValidLength && hasValidChars && hasReasonableLength
}

/**
 * Safely encode strings to base64
 */
export function safeBtoa(str: string): string {
  try {
    return btoa(str)
  } catch (error) {
    console.warn("Failed to encode base64 string:", error)
    return str
  }
}
