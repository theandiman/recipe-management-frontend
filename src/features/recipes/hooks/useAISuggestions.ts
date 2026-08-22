import { useState, useCallback } from 'react'
import { buildApiUrl } from '../../../utils/apiUtils'
import { postWithAuth } from '../../../utils/authApi'
import { useAIAuditTrail } from './useAIAuditTrail'
import type { AuditEntry, UndoResult } from './useAIAuditTrail'

export type { AuditEntry, UndoResult }

/** A single AI-generated suggestion for one recipe field. */
export type SuggestionSource = 'bulk' | 'field'

export interface FieldSuggestion {
  field: string
  suggestedValue: string
  reason: string
  source?: SuggestionSource
}

export const getSuggestionSource = (suggestion: Pick<FieldSuggestion, 'source'>): SuggestionSource =>
  suggestion.source ?? 'bulk'

export const isBulkSuggestion = (suggestion: Pick<FieldSuggestion, 'source'>): boolean =>
  getSuggestionSource(suggestion) === 'bulk'

export const isFieldSuggestion = (suggestion: Pick<FieldSuggestion, 'source'>): boolean =>
  getSuggestionSource(suggestion) === 'field'

const withSuggestionSource = (
  suggestions: FieldSuggestion[],
  source: SuggestionSource
): FieldSuggestion[] => suggestions.map(suggestion => ({ ...suggestion, source }))

/** Request payload for the suggest-fields endpoint. */
export interface FieldSuggestionRequest {
  recipeName?: string
  description?: string
  prepTime?: string
  cookTime?: string
  servings?: string
  tags?: string[]
  dietaryRestrictions?: string[]
  ingredients?: string[]
  instructions?: string[]
}

export type SuggestionStatus = 'idle' | 'loading' | 'success' | 'error'

/** Suggestible keys of FieldSuggestionRequest (excludes context-only array fields like ingredients/instructions). */
export type SuggestibleFieldKey = Exclude<keyof FieldSuggestionRequest, 'ingredients' | 'instructions'>
export type ListSuggestibleFieldKey = Extract<SuggestibleFieldKey, 'tags' | 'dietaryRestrictions'>
export type ScalarSuggestibleFieldKey = Exclude<SuggestibleFieldKey, ListSuggestibleFieldKey>
export type SuggestibleFieldValue<K extends SuggestibleFieldKey = SuggestibleFieldKey> =
  K extends ListSuggestibleFieldKey ? string[] : string

interface UseAISuggestionsReturn {
  suggestions: FieldSuggestion[]
  dismissedFields: Set<string>
  status: SuggestionStatus
  error: string | null
  fetchSuggestions: (request: FieldSuggestionRequest) => Promise<void>
  fetchFieldSuggestion: <K extends SuggestibleFieldKey>(
    field: K,
    currentValue: SuggestibleFieldValue<K>,
    context?: Partial<FieldSuggestionRequest>
  ) => Promise<void>
  fieldStatus: Map<string, SuggestionStatus>
  applySuggestion: (field: string, applyFn: (value: string) => void, previousValue: unknown) => void
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
  const [fieldStatus, setFieldStatus] = useState<Map<string, SuggestionStatus>>(new Map())

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
    setSuggestions([])
    setDismissedFields(new Set())
    setFieldStatus(new Map())
    setStatus('loading')
    setError(null)
    const startTime = Date.now()

    try {
      const apiBase = import.meta.env.VITE_AI_API_URL ?? import.meta.env.VITE_API_URL ?? ''
      const url = buildApiUrl(apiBase, '/api/recipes/suggest-fields')
      const res = await postWithAuth(url, request)
      const data = res.data as { suggestions: FieldSuggestion[] }
      const fetched = withSuggestionSource(data?.suggestions ?? [], 'bulk')
      setSuggestions(fetched)
      setDismissedFields(new Set())
      setStatus('success')

      const latencyMs = Date.now() - startTime
      const event = { type: 'ai_suggestions_fetched', count: fetched.length, latencyMs }
      console.log('[AI Suggestions]', event)
      window.dispatchEvent(new CustomEvent('ai:suggestions', { detail: event }))

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

  const fetchFieldSuggestion = useCallback(async (
    field: SuggestibleFieldKey,
    currentValue: string | string[],
    context?: Partial<FieldSuggestionRequest>
  ) => {
    setFieldStatus(prev => new Map(prev).set(field, 'loading'))
    setError(null)

    const request: FieldSuggestionRequest =
      field === 'tags' || field === 'dietaryRestrictions'
        ? {
            ...context,
            [field]: Array.isArray(currentValue) ? currentValue : [],
          }
        : {
            ...context,
            [field]: typeof currentValue === 'string' ? currentValue : '',
          }

    try {
      const apiBase = import.meta.env.VITE_AI_API_URL ?? import.meta.env.VITE_API_URL ?? ''
      const url = buildApiUrl(apiBase, '/api/recipes/suggest-fields')
      const res = await postWithAuth(url, request)
      const data = res.data as { suggestions: FieldSuggestion[] }
      const fetched = withSuggestionSource(data?.suggestions ?? [], 'field')
      const fieldSuggestions = fetched.filter(s => s.field === field)

      setSuggestions(prev => {
        const withoutField = prev.filter(s => !(s.field === field && isFieldSuggestion(s)))
        return [...withoutField, ...fieldSuggestions]
      })
      setDismissedFields(prev => {
        const next = new Set(prev)
        next.delete(field)
        return next
      })
      setFieldStatus(prev => new Map(prev).set(field, 'success'))

      for (const s of fieldSuggestions) {
        recordSuggestion(s.field, s.suggestedValue)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch AI suggestion'
      setError(msg)
      setFieldStatus(prev => new Map(prev).set(field, 'error'))
      console.warn('[AI Suggestions] fetchFieldSuggestion failed:', msg)
    }
  }, [recordSuggestion])

  const applySuggestion = useCallback((field: string, applyFn: (value: string) => void, previousValue: unknown) => {
    const suggestion = suggestions.find(s => s.field === field)
    if (!suggestion) return

    applyFn(suggestion.suggestedValue)
    setDismissedFields(prev => new Set([...prev, field]))

    recordAccepted(field, previousValue, suggestion.suggestedValue)

    const event = { type: 'ai_suggestion_applied', field }
    console.log('[AI Suggestions]', event)
    window.dispatchEvent(new CustomEvent('ai:suggestions', { detail: event }))
  }, [suggestions, recordAccepted])

  const dismissSuggestion = useCallback((field: string) => {
    setDismissedFields(prev => new Set([...prev, field]))

    recordRejected(field)

    const event = { type: 'ai_suggestion_dismissed', field }
    console.log('[AI Suggestions]', event)
    window.dispatchEvent(new CustomEvent('ai:suggestions', { detail: event }))
  }, [recordRejected])

  const visibleSuggestions = suggestions.filter(s => !dismissedFields.has(s.field))

  return {
    suggestions,
    dismissedFields,
    status,
    error,
    fetchSuggestions,
    fetchFieldSuggestion,
    fieldStatus,
    applySuggestion,
    dismissSuggestion,
    visibleSuggestions,
    auditLog,
    canUndo,
    undoLastAIChange,
    undoFieldAIChange,
  }
}
