import React from 'react'

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
    <div className="mt-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm flex items-start gap-3">
      <span className="text-amber-500 mt-0.5 shrink-0" aria-hidden="true">✨</span>
      <div className="flex-1 min-w-0">
        {currentValue && (
          <p className="text-gray-400 text-xs mb-0.5">
            <s>{currentValue}</s>
          </p>
        )}
        <p className="text-gray-800">{suggestion}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onApply}
          className="px-2 py-1 text-xs font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-2 py-1 text-xs font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
