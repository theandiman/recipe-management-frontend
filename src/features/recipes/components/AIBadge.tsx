import React from 'react'

interface AIBadgeProps {
  className?: string
}

export const AIBadge: React.FC<AIBadgeProps> = ({ className }) => (
  <span
    aria-hidden="true"
    className={`inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 ${className ?? ''}`}
  >
    AI
  </span>
)
