import { describe, it, expect } from 'vitest'
import { parseMinutes, formatMinutes } from './timeUtils'

describe('timeUtils', () => {
  describe('parseMinutes', () => {
    it('should parse hour-only strings', () => {
      expect(parseMinutes('1 hour')).toBe(60)
      expect(parseMinutes('2 hours')).toBe(120)
      expect(parseMinutes('3hour')).toBe(180)
    })

    it('should parse minute-only strings', () => {
      expect(parseMinutes('30 minutes')).toBe(30)
      expect(parseMinutes('45 mins')).toBe(45)
      expect(parseMinutes('15 min')).toBe(15)
      expect(parseMinutes('20m')).toBe(20)
    })

    it('should parse combined hour and minute strings', () => {
      expect(parseMinutes('1 hour 30 minutes')).toBe(90)
      expect(parseMinutes('2 hours 15 mins')).toBe(135)
      expect(parseMinutes('1hour 45min')).toBe(105)
    })

    it('should parse lone numbers as minutes', () => {
      expect(parseMinutes('45')).toBe(45)
      expect(parseMinutes('120')).toBe(120)
    })

    it('should handle case-insensitive input', () => {
      expect(parseMinutes('1 HOUR 30 MINUTES')).toBe(90)
      expect(parseMinutes('2 Hours 15 Mins')).toBe(135)
    })

    it('should return null for invalid inputs', () => {
      expect(parseMinutes(null)).toBeNull()
      expect(parseMinutes(undefined)).toBeNull()
      expect(parseMinutes('')).toBeNull()
      expect(parseMinutes('abc')).toBeNull()
      expect(parseMinutes(123)).toBeNull()
      expect(parseMinutes({})).toBeNull()
    })

    it('should return null for strings with no numbers', () => {
      expect(parseMinutes('no time here')).toBeNull()
      expect(parseMinutes('just text')).toBeNull()
    })
  })

  describe('formatMinutes', () => {
    it('should format minutes less than 60', () => {
      expect(formatMinutes(30)).toBe('30m')
      expect(formatMinutes(45)).toBe('45m')
      expect(formatMinutes(1)).toBe('1m')
    })

    it('should format exact hours', () => {
      expect(formatMinutes(60)).toBe('1h')
      expect(formatMinutes(120)).toBe('2h')
      expect(formatMinutes(180)).toBe('3h')
    })

    it('should format hours and minutes', () => {
      expect(formatMinutes(90)).toBe('1h 30m')
      expect(formatMinutes(135)).toBe('2h 15m')
      expect(formatMinutes(105)).toBe('1h 45m')
    })

    it('should handle null and undefined', () => {
      expect(formatMinutes(null)).toBe('')
      expect(formatMinutes(undefined)).toBe('')
    })

    it('should handle zero', () => {
      expect(formatMinutes(0)).toBe('0m')
    })

    it('should handle large numbers', () => {
      expect(formatMinutes(1440)).toBe('24h')
      expect(formatMinutes(1441)).toBe('24h 1m')
    })
  })
})
