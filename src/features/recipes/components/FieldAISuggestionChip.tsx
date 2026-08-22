import React from 'react'
import {
  AI_EYEBROW_CLASS,
  AI_MUTED_PANEL_CLASS,
  AI_PRIMARY_ACTION_CLASS,
  AI_SECONDARY_ACTION_CLASS,
} from './aiStyles'

export interface FieldAISuggestionChipProps {
  field: string
  suggestion: string
  currentValue: string
  onApply: () => void
  onDismiss: () => void
}

export const FieldAISuggestionChip: React.FC<FieldAISuggestionChipProps> = ({
  suggestion,
  currentValue,
  onApply,
  onDismiss,
}) => {
  return (
    <div className={`mt-2 px-3 py-3 text-sm flex items-start gap-3 ${AI_MUTED_PANEL_CLASS}`}>
      <div className="flex-1 min-w-0">
        <p className={AI_EYEBROW_CLASS}>AI suggestion</p>
        {currentValue && (
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="mr-1 font-medium text-gray-400 dark:text-gray-500">Current</span>
            <s>{currentValue}</s>
          </p>
        )}
        <p className="leading-5 text-gray-800 dark:text-gray-100">{suggestion}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onApply}
          className={AI_PRIMARY_ACTION_CLASS}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className={AI_SECONDARY_ACTION_CLASS}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
