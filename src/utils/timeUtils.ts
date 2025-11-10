/**
 * Parse human-readable time strings like "1 hour 30 minutes" or "45 minutes" into minutes
 * @param s - Time string to parse
 * @returns Number of minutes or null if parsing fails
 */
export const parseMinutes = (s: unknown): number | null => {
  if (!s || typeof s !== 'string') return null
  try {
    const low = s.toLowerCase()
    let mins = 0
    const h = low.match(/(\d+)\s*hour/)
    if (h) mins += parseInt(h[1], 10) * 60
    const m = low.match(/(\d+)\s*(?:minute|min)s?/) || low.match(/(\d+)\s*m\b/)
    if (m) mins += parseInt(m[1], 10)
    if (mins > 0) return mins
    const lone = low.match(/(\d+)\b/)
    if (lone) return parseInt(lone[1], 10)
  } catch (e) {
    console.debug('parseMinutes parse error', e)
    return null
  }
  return null
}

/**
 * Format minutes into a human-readable time string
 * @param n - Number of minutes
 * @returns Formatted time string (e.g., "1h 30m", "45m")
 */
export const formatMinutes = (n: number | null | undefined): string => {
  if (n == null) return ''
  if (n >= 60) {
    const h = Math.floor(n / 60)
    const r = n % 60
    return r === 0 ? `${h}h` : `${h}h ${r}m`
  }
  return `${n}m`
}
