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

/**
 * Format an ISO date string, Date object, or timestamp into a relative time string (e.g., "just now", "5m ago", "2h ago", "3d ago")
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: string | number | Date | undefined | null): string => {
  if (!date) return ''
  const then = new Date(date).getTime()
  if (isNaN(then)) return ''
  const now = Date.now()
  const diffInSeconds = Math.floor((now - then) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}d ago`
  }
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`
  }
  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}

