import { useState, useCallback } from 'react'
import { buildApiUrl } from '../../../utils/apiUtils'
import { postWithAuth } from '../../../utils/authApi'
import { useAIAuditTrail } from './useAIAuditTrail'
import type { AuditEntry, UndoResult } from './useAIAuditTrail'

export type { AuditEntry, UndoResult }

/** A single AI-generated suggestion for one recipe field. */
export interface FieldSuggestion {
  field: string
  suggestedValue: string
  reason: string
}

/** Request payload for the suggest-fields endpoint. */
export interface FieldSuggestionRequest {
  recipeName?: string
  description?: string
  prepTime?: string
  cookTime?: string
  servings?: string
  tags?: string[]
  ingredients?: string[]
  instructions?: string[]
}

export type SuggestionStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseAISuggestionsReturn {
  suggestions: FieldSuggestion[]
  dismissedFields: Set<string>
  status: SuggestionStatus
  error: string | null
  fetchSuggestions: (request: FieldSuggestionRequest) => Promise<void>
  applySuggestion: (field: string, applyFn: (value: string) => void, previousValue: string) => void
  dismissSuggestion: (field: string) => void
  visibleSuggestions: FieldSuggestion[]
  // Audit trail
  auditLog: AuditEntry[]
  canUndo: boolean
  undoLastAIChange: () => UndoResult | null
  undoFieldAIChange: (field: string) => UndoResult | null
}

/**
 * Manages the AI field suggestion lifecycle:
 * fetch → display → apply/dismiss per field.
 *
 * Analytics events are emitted via window.dispatchEvent and console.log
 * to remain framework-agnostic without requiring an external analytics service.
 */
export function useAISuggestions(): UseAISuggestionsReturn {
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([])
  const [dismissedFields, setDismissedFields] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<SuggestionStatus>('idle')
  const [error, setError] = useState<string | null>(null)

<<<<<<< HEAD
  const {
    auditLog,
    canUndo,
    recordSuggestion,
    recordAccepted,
    recordRejected,
    undoLastAIChange,
    undoFieldAIChange,
  } = useAIAuditTrail()

  const fetchSuggestions = useCallback(async (request: FieldSuggestionRequest) => {
=======
  const fetchSuggestions = useCallback(async (request: FieldSuggestionRequest) => {
    setSuggestions([])
    setDismissedFields(new Set())
>>>>>>> origin/main
    setStatus('loading')
    setError(null)
    const startTime = Date.now()

    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const url = buildApiUrl(apiBase, '/api/recipes/suggest-fields')
      const res = await postWithAuth(url, request)
      const data = res.data as { suggestions: FieldSuggestion[] }
      const fetched = data?.suggestions ?? []
      setSuggestions(fetched)
      setDismissedFields(new Set())
      setStatus('success')

      const latencyMs = Date.now() - startTime
      const event = { type: 'ai_suggestions_fetched', count: fetched.length, latencyMs }
      console.log('[AI Suggestions]', event)
      window.dispatchEvent(new CustomEvent('ai:suggestions', { detail: event }))
<<<<<<< HEAD

      // Record each fetched suggestion in the audit trail
      for (const s of fetched) {
        recordSuggestion(s.field, s.suggestedValue)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch AI suggestions'
      setError(msg)
      setStatus('error')
      console.warn('[AI Suggestions] fetch failed:', msg)
    }
  }, [recordSuggestion])

  const applySuggestion = useCallback((field: string, applyFn: (value: string) => void, previousValue: string) => {
=======
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch AI suggestions'
      setError(msg)
      setSuggestions([])
      setDismissedFields(new Set())
      setStatus('error')
      console.warn('[AI Suggestions] fetch failed:', msg)
    }
  }, [])

  const applySuggestion = useCallback((field: string, applyFn: (value: string) => void) => {
>>>>>>> origin/main
    const suggestion = suggestions.find(s => s.field === field)
    if (!suggestion) return

    applyFn(suggestion.suggestedValue)
    setDismissedFields(prev => new Set([...prev, field]))

<<<<<<< HEAD
    recordAccepted(field, previousValue, suggestion.suggestedValue)

    const event = { type: 'ai_suggestion_applied', field }
    console.log('[AI Suggestions]', event)
    window.dispatchEvent(new CustomEvent('ai:suggestions', { detail: event }))
  }, [suggestions, recordAccepted])
=======
    const event = { type: 'ai_suggestion_applied', field }
    console.log('[AI Suggestions]', event)
    window.dispatchEvent(new CustomEvent('ai:suggestions', { detail: event }))
  }, [suggestions])
>>>>>>> origin/main

  const dismissSuggestion = useCallback((field: string) => {
    setDismissedFields(prev => new Set([...prev, field]))

<<<<<<< HEAD
    recordRejected(field)

    const event = { type: 'ai_suggestion_dismissed', field }
    console.log('[AI Suggestions]', event)
    window.dispatchEvent(new CustomEvent('ai:suggestions', { detail: event }))
  }, [recordRejected])
=======
    const event = { type: 'ai_suggestion_dismissed', field }
    console.log('[AI Suggestions]', event)
    window.dispatchEvent(new CustomEvent('ai:suggestions', { detail: event }))
  }, [])
>>>>>>> origin/main

  const visibleSuggestions = suggestions.filter(s => !dismissedFields.has(s.field))

  return {
    suggestions,
    dismissedFields,
    status,
    error,
    fetchSuggestions,
    applySuggestion,
    dismissSuggestion,
    visibleSuggestions,
<<<<<<< HEAD
    auditLog,
    canUndo,
    undoLastAIChange,
    undoFieldAIChange,
=======
>>>>>>> origin/main
  }
}
