export interface DetectedTimer {
  fullMatch: string
  label: string
  totalSeconds: number
  startIndex: number
  endIndex: number
}

export function parseTimerDurations(text: string): DetectedTimer[] {
  if (!text) return []

  const results: DetectedTimer[] = []

  // Regex pattern matching:
  // 1. Range durations: "15-20 minutes", "5 to 10 mins"
  // 2. Hour + Minute combinations: "1 hour 30 minutes", "2 hrs 15 mins"
  // 3. Simple durations: "25 minutes", "10 mins", "1 hour", "45 secs"
  const regex =
    /\b(?:(\d+)\s*(?:-|to)\s*)?(\d+)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b(?:\s*(\d+)\s*(minutes?|mins?|m|seconds?|secs?|s))?/gi

  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0]
    const startIndex = match.index
    const endIndex = startIndex + fullMatch.length

    // Extract numbers and units
    const num1 = parseInt(match[1] || '0', 10)
    const num2 = parseInt(match[2] || '0', 10)
    const unit1 = (match[3] || '').toLowerCase()
    const num3 = parseInt(match[4] || '0', 10)
    const unit2 = (match[5] || '').toLowerCase()

    // Determine target number (for ranges like 15-20 mins, use max 20)
    const primaryNum = num2 || num1

    let totalSeconds = 0

    if (unit1.startsWith('h')) {
      totalSeconds += primaryNum * 3600
    } else if (unit1.startsWith('m')) {
      totalSeconds += primaryNum * 60
    } else if (unit1.startsWith('s')) {
      totalSeconds += primaryNum
    }

    if (num3 > 0) {
      if (unit2.startsWith('m')) {
        totalSeconds += num3 * 60
      } else if (unit2.startsWith('s')) {
        totalSeconds += num3
      }
    }

    // Ignore tiny values (< 5 seconds) or unreasonably huge (> 24 hours)
    if (totalSeconds >= 5 && totalSeconds <= 86400) {
      results.push({
        fullMatch,
        label: fullMatch,
        totalSeconds,
        startIndex,
        endIndex,
      })
    }
  }

  return results
}

export function formatTimeRemaining(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Web Audio API synthesize pleasant completion chime alert.
 */
export function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()

    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.15, startTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    const now = ctx.currentTime
    // Pleasant arpeggio C5 -> E5 -> G5 -> C6
    playNote(523.25, now, 0.4)
    playNote(659.25, now + 0.15, 0.4)
    playNote(783.99, now + 0.3, 0.4)
    playNote(1046.5, now + 0.45, 0.8)
  } catch {
    // Audio Context restricted or unavailable
  }
}
