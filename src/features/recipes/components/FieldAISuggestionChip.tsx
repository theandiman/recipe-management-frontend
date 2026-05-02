import React from 'react'
import { AIBadge } from './AIBadge'
import { AI_MUTED_PANEL_CLASS, AI_PRIMARY_ACTION_CLASS, AI_SECONDARY_ACTION_CLASS } from './aiStyles'

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
      <AIBadge className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {currentValue && (
          <p className="text-gray-500 text-xs mb-1">
            <s>{currentValue}</s>
          </p>
        )}
        <p className="text-gray-800 leading-5">{suggestion}</p>
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
