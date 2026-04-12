import React from 'react'
import type { FieldSuggestion, SuggestionStatus } from '../hooks/useAISuggestions'
import { FIELD_LABELS } from '../constants/aiConstants'
import { AISpinnerIcon } from './AISpinnerIcon'

const STEP_FIELDS: Record<number, string[]> = {
  1: ['recipeName', 'description'],
  4: ['prepTime', 'cookTime', 'servings', 'tags'],
}

interface AISuggestionPanelProps {
  suggestions: FieldSuggestion[]
  status: SuggestionStatus
  error: string | null
  onApply: (field: string, applyFn: (value: string) => void, previousValue: string) => void
  onDismiss: (field: string) => void
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
  const stepFilteredSuggestions =
    currentStep && STEP_FIELDS[currentStep]
      ? suggestions.filter(s => STEP_FIELDS[currentStep].includes(s.field))
      : suggestions

  const autoCollapsed = status === 'success' && stepFilteredSuggestions.length === 0
  const [isExpanded, setIsExpanded] = React.useState(!autoCollapsed)

  React.useEffect(() => {
    if (autoCollapsed) setIsExpanded(false)
  }, [autoCollapsed])

  if (status === 'idle') return null

  const hasSuggestions = stepFilteredSuggestions.length > 0

  return (
    <div
      className="mb-4 rounded-xl border border-amber-300 bg-amber-50 shadow-sm"
      role="region"
      aria-label="AI field suggestions"
    >
      {/* Panel header */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-xl"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2 font-semibold text-amber-800 text-sm">
          <span aria-hidden="true">✨</span>
          AI Suggestions
          {hasSuggestions && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
              {stepFilteredSuggestions.length}
            </span>
          )}
        </span>
        <span className="text-amber-600 text-xs">{isExpanded ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Loading state */}
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-amber-700 text-sm py-2">
              <AISpinnerIcon />
              Analysing your recipe for improvement suggestions…
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex items-center justify-between text-sm text-amber-800 py-2">
              <span>⚠️ {error ?? 'Could not load suggestions.'}</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="ml-3 px-3 py-1 text-xs rounded-md bg-amber-200 hover:bg-amber-300 text-amber-800 font-medium transition-colors"
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
                    key={suggestion.field}
                    className="rounded-lg border border-amber-200 bg-white p-3 flex flex-col sm:flex-row sm:items-center gap-2"
                    role="listitem"
                    aria-label={`AI suggestion for ${label}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-700 mb-1">{label}</p>
                      {currentValue && (
                        <p
                          className="text-xs text-gray-500 break-words bg-gray-50 rounded px-2 py-1 border border-gray-100 mb-1 line-through"
                          aria-label={`Current value: ${currentValue}`}
                        >
                          {currentValue}
                        </p>
                      )}
                      <p
                        className="text-sm text-gray-800 break-words bg-amber-50 rounded px-2 py-1 border border-amber-100"
                        aria-label={`Suggested value: ${suggestion.suggestedValue}`}
                      >
                        ✨ {suggestion.suggestedValue}
                      </p>
                      {suggestion.reason && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">{suggestion.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {setter && (
                        <button
                          type="button"
                          onClick={() => onApply(suggestion.field, setter, previousValue)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                          aria-label={`Apply AI suggestion for ${label}`}
                        >
                          Apply
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDismiss(suggestion.field)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
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
