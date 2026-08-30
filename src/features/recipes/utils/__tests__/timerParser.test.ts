import { describe, it, expect } from 'vitest'
import { parseTimerDurations, formatTimeRemaining } from '../timerParser'

describe('timerParser', () => {
  it('parses simple minute durations', () => {
    const text = 'Bake in the oven for 25 minutes until golden brown.'
    const timers = parseTimerDurations(text)

    expect(timers).toHaveLength(1)
    expect(timers[0].label).toBe('25 minutes')
    expect(timers[0].totalSeconds).toBe(1500)
  })

  it('parses minute ranges by selecting upper bound', () => {
    const text = 'Simmer gently for 15-20 mins.'
    const timers = parseTimerDurations(text)

    expect(timers).toHaveLength(1)
    expect(timers[0].totalSeconds).toBe(1200)
  })

  it('parses hour and minute combinations', () => {
    const text = 'Roast for 1 hour 30 mins.'
    const timers = parseTimerDurations(text)

    expect(timers).toHaveLength(1)
    expect(timers[0].totalSeconds).toBe(5400)
  })

  it('returns empty array when no duration is detected', () => {
    const text = 'Mix ingredients thoroughly in a large bowl.'
    const timers = parseTimerDurations(text)

    expect(timers).toHaveLength(0)
  })

  it('formats time remaining correctly', () => {
    expect(formatTimeRemaining(90)).toBe('01:30')
    expect(formatTimeRemaining(3665)).toBe('1:01:05')
  })
})
