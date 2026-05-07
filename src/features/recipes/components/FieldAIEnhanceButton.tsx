import React from 'react'
import type { SuggestionStatus } from '../hooks/useAISuggestions'
import { AISpinnerIcon } from './AISpinnerIcon'
import { AI_ICON_BUTTON_CLASS } from './aiStyles'

export interface FieldAIEnhanceButtonProps {
  field: string
  currentValue: string
  status: SuggestionStatus
  onEnhance: () => void
  className?: string
}

export const FieldAIEnhanceButton: React.FC<FieldAIEnhanceButtonProps> = ({
  field,
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
      data-field={field}
      className={`${AI_ICON_BUTTON_CLASS} ${className ?? ''}`}
    >
      {isLoading ? (
        <AISpinnerIcon className="w-3.5 h-3.5" />
      ) : (
        <span aria-hidden="true">AI</span>
      )}
    </button>
  )
}
