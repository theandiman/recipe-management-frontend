import React from 'react'

interface AIBadgeProps {
  className?: string
}

export const AIBadge: React.FC<AIBadgeProps> = ({ className }) => (
  <span
    aria-hidden="true"
    className={`inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 ${className ?? ''}`}
  >
    AI
  </span>
)
