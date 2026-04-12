import React from 'react'
import type { SuggestionStatus } from '../hooks/useAISuggestions'

export interface FieldAIEnhanceButtonProps {
  field: string
  currentValue: string
  status: SuggestionStatus
  onEnhance: () => void
  className?: string
}

export const FieldAIEnhanceButton: React.FC<FieldAIEnhanceButtonProps> = ({
  currentValue,
  status,
  onEnhance,
  className,
}) => {
  const isEmpty = !currentValue
  const isLoading = status === 'loading'
  const label = isEmpty ? 'Complete with AI' : 'Enhance with AI'
  const title = isEmpty ? 'Let AI suggest a value' : 'Let AI improve this'

  return (
    <button
      type="button"
      onClick={onEnhance}
      disabled={isLoading}
      aria-label={label}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-amber-400 hover:text-amber-500 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className ?? ''}`}
    >
      {isLoading ? (
        <span className="animate-spin text-xs" aria-hidden="true">⏳</span>
      ) : (
        <span aria-hidden="true">✨</span>
      )}
    </button>
  )
}
