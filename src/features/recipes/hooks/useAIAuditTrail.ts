/**
 * useAIAuditTrail — session-scoped audit log for AI suggestion interactions.
 *
 * Records every suggested / accepted / rejected / undone event with a
 * timestamp and the before/after values so changes are fully reversible.
 *
 * No backend persistence — audit entries live only for the duration of
 * the current edit session, which is sufficient for the undo requirement.
 *
 * Analytics are emitted via:
 *   - console.log('[AI_AUDIT]', entry)
 *   - window.dispatchEvent(new CustomEvent('ai-audit', { detail: entry }))
 */

import { useState, useCallback, useMemo } from 'react'

export type AuditEvent = 'suggested' | 'accepted' | 'rejected' | 'undone'

export interface AuditEntry {
  id: string
  timestamp: number
  field: string
  event: AuditEvent
  previousValue: unknown
  newValue: unknown
}

export interface UndoResult {
  field: string
  previousValue: unknown
}

interface UseAIAuditTrailReturn {
  auditLog: AuditEntry[]
  canUndo: boolean
  recordSuggestion: (field: string, suggestedValue: unknown) => void
  recordAccepted: (field: string, previousValue: unknown, newValue: unknown) => void
  recordRejected: (field: string) => void
  undoLastAIChange: () => UndoResult | null
  undoFieldAIChange: (field: string) => UndoResult | null
}

let _idCounter = 0
export function _resetIdCounter(): void {
  _idCounter = 0
}

function generateId(): string {
  _idCounter += 1
  return `audit-${Date.now()}-${_idCounter}`
}

function emitAnalytics(entry: AuditEntry): void {
  console.log('[AI_AUDIT]', entry)
  window.dispatchEvent(new CustomEvent('ai-audit', { detail: entry }))
}

/**
 * Given the current log, compute a Set of accepted entry IDs that have
 * already been consumed by an 'undone' entry.  For each 'undone' entry
 * we pair it with the most-recent unmatched 'accepted' for the same field.
 */
function computeConsumedIds(log: AuditEntry[]): Set<string> {
  const consumed = new Set<string>()
  for (const entry of log) {
    if (entry.event === 'undone') {
      for (let i = log.length - 1; i >= 0; i--) {
        const e = log[i]
        if (e.event === 'accepted' && e.field === entry.field && !consumed.has(e.id)) {
          consumed.add(e.id)
          break
        }
      }
    }
  }
  return consumed
}

export function useAIAuditTrail(): UseAIAuditTrailReturn {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])

  const addEntry = useCallback((entry: AuditEntry) => {
    setAuditLog(prev => [...prev, entry])
    emitAnalytics(entry)
  }, [])

  const recordSuggestion = useCallback((field: string, suggestedValue: unknown) => {
    addEntry({
      id: generateId(),
      timestamp: Date.now(),
      field,
      event: 'suggested',
      previousValue: null,
      newValue: suggestedValue,
    })
  }, [addEntry])

  const recordAccepted = useCallback((field: string, previousValue: unknown, newValue: unknown) => {
    addEntry({
      id: generateId(),
      timestamp: Date.now(),
      field,
      event: 'accepted',
      previousValue,
      newValue,
    })
  }, [addEntry])

  const recordRejected = useCallback((field: string) => {
    addEntry({
      id: generateId(),
      timestamp: Date.now(),
      field,
      event: 'rejected',
      previousValue: null,
      newValue: null,
    })
  }, [addEntry])

  /**
   * Finds the most-recent 'accepted' entry that has not yet been undone,
   * appends an 'undone' entry to the log, and returns the { field, previousValue }
   * so the caller can revert the form field.  Returns null if there is nothing
   * to undo.
   */
  const undoLastAIChange = useCallback((): UndoResult | null => {
    const consumed = computeConsumedIds(auditLog)

    for (let i = auditLog.length - 1; i >= 0; i--) {
      const e = auditLog[i]
      if (e.event === 'accepted' && !consumed.has(e.id)) {
        const undoneEntry: AuditEntry = {
          id: generateId(),
          timestamp: Date.now(),
          field: e.field,
          event: 'undone',
          previousValue: e.newValue,
          newValue: e.previousValue,
        }
        setAuditLog(prev => [...prev, undoneEntry])
        emitAnalytics(undoneEntry)
        return { field: e.field, previousValue: e.previousValue }
      }
    }

    return null
  }, [auditLog])

  /**
   * Finds the most-recent 'accepted' entry for the given field that has not
   * yet been undone, appends an 'undone' entry, and returns the previousValue.
   */
  const undoFieldAIChange = useCallback((field: string): UndoResult | null => {
    const consumed = computeConsumedIds(auditLog)

    for (let i = auditLog.length - 1; i >= 0; i--) {
      const e = auditLog[i]
      if (e.event === 'accepted' && e.field === field && !consumed.has(e.id)) {
        const undoneEntry: AuditEntry = {
          id: generateId(),
          timestamp: Date.now(),
          field: e.field,
          event: 'undone',
          previousValue: e.newValue,
          newValue: e.previousValue,
        }
        setAuditLog(prev => [...prev, undoneEntry])
        emitAnalytics(undoneEntry)
        return { field: e.field, previousValue: e.previousValue }
      }
    }

    return null
  }, [auditLog])

  const canUndo = useMemo(() => {
    const consumed = computeConsumedIds(auditLog)
    return auditLog.some(e => e.event === 'accepted' && !consumed.has(e.id))
  }, [auditLog])

  return {
    auditLog,
    canUndo,
    recordSuggestion,
    recordAccepted,
    recordRejected,
    undoLastAIChange,
    undoFieldAIChange,
  }
}
