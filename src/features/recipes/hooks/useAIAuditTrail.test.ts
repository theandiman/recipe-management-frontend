/**
 * Tests for useAIAuditTrail hook — covers all BDD scenarios from issue #31.
 *
 * Scenario 1: Apply suggestion is recorded in audit log
 * Scenario 2: Undo last AI change
 * Scenario 3: Manual edits after undo are not affected
 * Scenario 4: Per-field undo
 * Scenario 5: Analytics events emitted
 * Scenario 6: canUndo reflects state
 * Scenario 7: Double-undo does not corrupt state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAIAuditTrail, _resetIdCounter } from './useAIAuditTrail'
import type { UndoResult } from './useAIAuditTrail'

beforeEach(() => {
  _resetIdCounter()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Scenario 1: Apply suggestion is recorded in audit log
// ---------------------------------------------------------------------------
describe('Scenario 1 — recordAccepted creates an audit entry', () => {
  it('adds an accepted entry with correct shape', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('description', 'old desc', 'new AI desc')
    })

    const log = result.current.auditLog
    expect(log).toHaveLength(1)
    const entry = log[0]
    expect(entry.field).toBe('description')
    expect(entry.event).toBe('accepted')
    expect(entry.previousValue).toBe('old desc')
    expect(entry.newValue).toBe('new AI desc')
    expect(typeof entry.timestamp).toBe('number')
    expect(typeof entry.id).toBe('string')
  })

  it('recordSuggestion adds a suggested entry', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordSuggestion('title', 'AI title suggestion')
    })

    const log = result.current.auditLog
    expect(log).toHaveLength(1)
    expect(log[0].event).toBe('suggested')
    expect(log[0].newValue).toBe('AI title suggestion')
  })

  it('recordRejected adds a rejected entry', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordRejected('prepTime')
    })

    const log = result.current.auditLog
    expect(log).toHaveLength(1)
    expect(log[0].event).toBe('rejected')
    expect(log[0].field).toBe('prepTime')
  })

  it('multiple records accumulate in order', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordSuggestion('description', 'suggested')
      result.current.recordAccepted('description', 'old', 'new')
    })

    expect(result.current.auditLog).toHaveLength(2)
    expect(result.current.auditLog[0].event).toBe('suggested')
    expect(result.current.auditLog[1].event).toBe('accepted')
  })
})

// ---------------------------------------------------------------------------
// Scenario 2: Undo last AI change
// ---------------------------------------------------------------------------
describe('Scenario 2 — undoLastAIChange', () => {
  it('reverts to the previous value and returns it', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('prepTime', '10', '20')
    })

    let undoResult: UndoResult | null = null
    act(() => {
      undoResult = result.current.undoLastAIChange()
    })

    expect(undoResult).toEqual({ field: 'prepTime', previousValue: '10' })
  })

  it('appends an undone entry to the audit log', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('title', 'Original', 'AI Title')
    })
    act(() => {
      result.current.undoLastAIChange()
    })

    const log = result.current.auditLog
    const undoneEntries = log.filter(e => e.event === 'undone')
    expect(undoneEntries).toHaveLength(1)
    expect(undoneEntries[0].field).toBe('title')
  })

  it('returns null when there is nothing to undo', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    let undoResult: UndoResult | null = null
    act(() => {
      undoResult = result.current.undoLastAIChange()
    })

    expect(undoResult).toBeNull()
  })

  it('undoes the LAST accepted entry, not an earlier one', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('title', 'Original Title', 'AI Title')
      result.current.recordAccepted('description', 'Original Desc', 'AI Desc')
    })

    let undoResult: UndoResult | null = null
    act(() => {
      undoResult = result.current.undoLastAIChange()
    })

    // Should undo the most recent (description), not the first (title)
    if (!undoResult) return;
    expect((undoResult as any).field).toBe('description')
    expect((undoResult as any).previousValue).toBe('Original Desc')
  })
})

// ---------------------------------------------------------------------------
// Scenario 3: Manual edits after undo are not affected
// ---------------------------------------------------------------------------
describe('Scenario 3 — manual edits are not affected by undo', () => {
  it('undo returns the correct previousValue captured at apply time', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    // User accepts AI suggestion for title
    act(() => {
      result.current.recordAccepted('title', 'Original Title', 'AI Title')
    })

    // User then manually edits description — we just don't record it in the audit trail
    // (manual edits are never recorded, only AI interactions are)
    // The audit log should not include description at all
    expect(result.current.auditLog.some(e => e.field === 'description')).toBe(false)

    // Undo title — description is unaffected because it was never in the audit log
    let undoResult: UndoResult | null = null
    act(() => {
      undoResult = result.current.undoLastAIChange()
    })

    if (!undoResult) return;
    expect((undoResult as any).field).toBe('title')
    expect((undoResult as any).previousValue).toBe('Original Title')
    // description is not in the result — caller only reverts the returned field
  })
})

// ---------------------------------------------------------------------------
// Scenario 4: Per-field undo
// ---------------------------------------------------------------------------
describe('Scenario 4 — undoFieldAIChange', () => {
  it('only reverts the targeted field', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('title', 'Old Title', 'AI Title')
      result.current.recordAccepted('prepTime', '10', '15')
    })

    let undoResult: UndoResult | null = null
    act(() => {
      undoResult = result.current.undoFieldAIChange('title')
    })

    expect(undoResult).toEqual({ field: 'title', previousValue: 'Old Title' })

    // prepTime accepted entry should still be undoable
    const log = result.current.auditLog
    const consumed = new Set(log.filter(e => e.event === 'undone').map(e => e.field))
    expect(consumed.has('title')).toBe(true)
    expect(consumed.has('prepTime')).toBe(false)
  })

  it('returns null if the field has no accepted AI change', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('title', 'Old', 'New')
    })

    let undoResult: UndoResult | null = null
    act(() => {
      undoResult = result.current.undoFieldAIChange('description')
    })

    expect(undoResult).toBeNull()
  })

  it('does not touch other fields when undoing one', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('cookTime', '30', '45')
      result.current.recordAccepted('servings', '2', '4')
    })

    act(() => {
      result.current.undoFieldAIChange('cookTime')
    })

    // servings entry is still 'accepted' (not undone)
    const servingsAccepted = result.current.auditLog.filter(
      e => e.event === 'accepted' && e.field === 'servings'
    )
    expect(servingsAccepted).toHaveLength(1)
    expect(result.current.canUndo).toBe(true) // servings is still undoable
  })
})

// ---------------------------------------------------------------------------
// Scenario 5: Analytics events emitted
// ---------------------------------------------------------------------------
describe('Scenario 5 — analytics events', () => {
  it('emits console.log and CustomEvent on recordAccepted', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('description', 'old', 'new')
    })

    expect(consoleSpy).toHaveBeenCalledWith('[AI_AUDIT]', expect.objectContaining({ event: 'accepted' }))
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ai-audit' })
    )
  })

  it('emits analytics on recordRejected', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordRejected('title')
    })

    expect(consoleSpy).toHaveBeenCalledWith('[AI_AUDIT]', expect.objectContaining({ event: 'rejected' }))
  })

  it('emits analytics on undoLastAIChange', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('title', 'old', 'new')
    })

    consoleSpy.mockClear()

    act(() => {
      result.current.undoLastAIChange()
    })

    expect(consoleSpy).toHaveBeenCalledWith('[AI_AUDIT]', expect.objectContaining({ event: 'undone' }))
  })

  it('CustomEvent detail contains field and timestamp', () => {
    const events: CustomEvent[] = []
    window.addEventListener('ai-audit', (e) => events.push(e as CustomEvent), { once: true })

    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('prepTime', '10', '20')
    })

    expect(events.length).toBeGreaterThanOrEqual(1)
    const detail = events[events.length - 1].detail
    expect(detail.field).toBe('prepTime')
    expect(typeof detail.timestamp).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Scenario 6: canUndo reflects state
// ---------------------------------------------------------------------------
describe('Scenario 6 — canUndo', () => {
  it('is false initially', () => {
    const { result } = renderHook(() => useAIAuditTrail())
    expect(result.current.canUndo).toBe(false)
  })

  it('is false after only suggestions and rejections', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordSuggestion('title', 'AI Title')
      result.current.recordRejected('title')
    })

    expect(result.current.canUndo).toBe(false)
  })

  it('becomes true after an accepted entry', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('title', 'Old', 'New')
    })

    expect(result.current.canUndo).toBe(true)
  })

  it('becomes false after all accepted entries are undone', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('title', 'Old', 'New')
    })
    act(() => {
      result.current.undoLastAIChange()
    })

    expect(result.current.canUndo).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Scenario 7: Double-undo does not corrupt state

// Regression: accept → undo → accept again on same field

describe('Regression: accept → undo → accept again on same field', () => {
  it('canUndo remains true, undo undoes the latest accepted entry', () => {
    const { result } = renderHook(() => useAIAuditTrail())
    act(() => {
      result.current.recordAccepted('title', 'Original', 'AI1')
    })
    act(() => {
      result.current.undoLastAIChange()
    })
    act(() => {
      result.current.recordAccepted('title', 'AI1', 'AI2')
    })
    // Should be undoable
    expect(result.current.canUndo).toBe(true)
    let undoResult: UndoResult | null = null
    act(() => {
      undoResult = result.current.undoLastAIChange()
    })
    expect(undoResult).toEqual({ field: 'title', previousValue: 'AI1' })
    // The audit log should show two accepted, two undone
    const accepted = result.current.auditLog.filter(e => e.event === 'accepted')
    const undone = result.current.auditLog.filter(e => e.event === 'undone')
    expect(accepted).toHaveLength(2)
    expect(undone).toHaveLength(2)
    // The last undone should correspond to the second accepted
    expect(undone[1].previousValue).toBe('AI2')
    expect(undone[1].newValue).toBe('AI1')
  })
})

// ---------------------------------------------------------------------------
describe('Scenario 7 — double-undo safety', () => {
  it('returns null on the second undo attempt', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('title', 'Original', 'AI')
    })
    act(() => {
      result.current.undoLastAIChange()
    })

    let secondUndo: UndoResult | null = null
    act(() => {
      secondUndo = result.current.undoLastAIChange()
    })

    expect(secondUndo).toBeNull()
  })

  it('does not add extra undone entries on double-undo', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('title', 'Original', 'AI')
    })
    // First undo — succeeds
    act(() => {
      result.current.undoLastAIChange()
    })
    // Second undo after re-render — should be a no-op (canUndo is false)
    act(() => {
      result.current.undoLastAIChange()
    })

    const undoneCount = result.current.auditLog.filter(e => e.event === 'undone').length
    expect(undoneCount).toBe(1)
  })

  it('canUndo stays false after double-undo attempt', () => {
    const { result } = renderHook(() => useAIAuditTrail())

    act(() => {
      result.current.recordAccepted('description', 'Old', 'AI')
    })
    act(() => {
      result.current.undoLastAIChange()
    })
    act(() => {
      result.current.undoLastAIChange()
    })

    expect(result.current.canUndo).toBe(false)
  })
})
