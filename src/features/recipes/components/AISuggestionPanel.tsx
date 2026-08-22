import React from 'react'
import { getSuggestionKey, isBulkSuggestion } from '../hooks/useAISuggestions'
import type { FieldSuggestion, SuggestionStatus } from '../hooks/useAISuggestions'
import { FIELD_LABELS, STEP_FIELDS } from '../constants/aiConstants'
import { AISpinnerIcon } from './AISpinnerIcon'
import { AIBadge } from './AIBadge'
import {
  AI_MUTED_PANEL_CLASS,
  AI_PANEL_CLASS,
  AI_PRIMARY_ACTION_CLASS,
  AI_SECONDARY_ACTION_CLASS,
} from './aiStyles'

interface AISuggestionPanelProps {
  suggestions: FieldSuggestion[]
  status: SuggestionStatus
  error: string | null
  onApply: (suggestion: FieldSuggestion, applyFn: (value: string) => void, previousValue: string) => void
  onDismiss: (suggestion: FieldSuggestion) => void
  /** Maps field names to their corresponding form setter functions */
  fieldSetters: Partial<Record<string, (value: string) => void>>
  /** Current form values keyed by field name */
  currentValues?: Partial<Record<string, string>>
  onRetry?: () => void
  /** When provided, only suggestions relevant to that step's fields are shown */
  currentStep?: number
}

/**
 * Collapsible panel that displays AI-generated field suggestions.
 *
 * - Renders suggestions filtered to the active form step when currentStep is provided.
 * - Each suggestion has an Apply and Dismiss button.
 * - Auto-collapses when success + no visible suggestions for the current step.
 * - Auto-expands when loading or error to ensure the user sees status updates.
 */
export const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({
  suggestions,
  status,
  error,
  onApply,
  onDismiss,
  fieldSetters,
  currentValues,
  onRetry,
  currentStep,
}) => {
  const bulkSuggestions = React.useMemo(
    () => suggestions.filter(isBulkSuggestion),
    [suggestions]
  )

  const stepFilteredSuggestions = React.useMemo(() => {
    if (currentStep === undefined) return bulkSuggestions
    const allowedFields = STEP_FIELDS[currentStep] ?? []
    // No mapping for this step → show all (steps 2, 3 etc. are not restricted)
    if (allowedFields.length === 0) return bulkSuggestions
    return bulkSuggestions.filter(s => allowedFields.includes(s.field))
  }, [bulkSuggestions, currentStep])

  const autoCollapsed = status === 'success' && stepFilteredSuggestions.length === 0
  const [isExpanded, setIsExpanded] = React.useState(!autoCollapsed)

  React.useEffect(() => {
    if (autoCollapsed) {
      setIsExpanded(false)
      return
    }
    if (status === 'loading' || status === 'error' || (status === 'success' && stepFilteredSuggestions.length > 0)) {
      setIsExpanded(true)
    }
  }, [autoCollapsed, status, stepFilteredSuggestions.length])

  if (status === 'idle') return null

  const hasSuggestions = stepFilteredSuggestions.length > 0

  return (
    <div
      className={`mb-4 ${AI_PANEL_CLASS}`}
      role="region"
      aria-label="AI field suggestions"
    >
      {/* Panel header */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-3 text-sm">
          <AIBadge />
          <span className="font-semibold text-gray-900 dark:text-gray-100">AI Suggestions</span>
          {hasSuggestions && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-emerald-100 px-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200">
              {stepFilteredSuggestions.length}
            </span>
          )}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{isExpanded ? 'Hide' : 'Show'}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Loading state */}
          {status === 'loading' && (
            <div className={`flex items-center gap-2 py-3 px-3 text-sm text-gray-600 dark:text-gray-300 ${AI_MUTED_PANEL_CLASS}`}>
              <AISpinnerIcon />
              Reviewing fields for suggestions...
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 py-3 px-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              <span>
                Could not load suggestions.
                {error ? ` ${error}` : ''}
              </span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={AI_SECONDARY_ACTION_CLASS}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Suggestion cards */}
          {status === 'success' && hasSuggestions && (
            <ul className="space-y-2 mt-1" role="list">
              {stepFilteredSuggestions.map(suggestion => {
                const setter = fieldSetters[suggestion.field]
                const label = FIELD_LABELS[suggestion.field] ?? suggestion.field
                const currentValue = currentValues?.[suggestion.field]
                const previousValue = currentValue ?? ''
                return (
                  <li
                    key={getSuggestionKey(suggestion)}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-800/60 sm:flex-row sm:items-center"
                    role="listitem"
                    aria-label={`AI suggestion for ${label}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</p>
                        <AIBadge />
                      </div>
                      {currentValue && (
                        <p
                          className="mb-2 break-words rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                          aria-label={`Current value: ${currentValue}`}
                        >
                          <span className="mr-1 font-medium text-gray-400 dark:text-gray-500">Current</span>
                          <s>{currentValue}</s>
                        </p>
                      )}
                      <p
                        className="break-words rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-sm text-gray-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-gray-100"
                        aria-label={`Suggested value: ${suggestion.suggestedValue}`}
                      >
                        <span className="mr-1 font-medium text-emerald-700 dark:text-emerald-200">Suggested</span>
                        {suggestion.suggestedValue}
                      </p>
                      {suggestion.reason && (
                        <p className="mt-0.5 text-xs italic text-gray-500 dark:text-gray-400">{suggestion.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {setter && (
                        <button
                          type="button"
                          onClick={() => onApply(suggestion, setter, previousValue)}
                          className={AI_PRIMARY_ACTION_CLASS}
                          aria-label={`Apply AI suggestion for ${label}`}
                        >
                          Apply
                        </button>
                      )}
                        <button
                          type="button"
                          onClick={() => onDismiss(suggestion)}
                          className={AI_SECONDARY_ACTION_CLASS}
                          aria-label={`Dismiss AI suggestion for ${label}`}
                        >
                          Dismiss
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
