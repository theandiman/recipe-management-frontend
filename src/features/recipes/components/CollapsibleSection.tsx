import React from 'react'

interface CollapsibleSectionProps {
  title: string
  icon: string
  isOpen: boolean
  isFilled?: boolean
  onToggle: () => void
  children: React.ReactNode
  'data-testid'?: string
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isOpen,
  isFilled = false,
  onToggle,
  children,
  'data-testid': testId,
}) => {
  return (
    <div
      className="border border-gray-200 rounded-xl overflow-hidden"
      data-testid={testId}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl" aria-hidden="true">
            {icon}
          </span>
          <span className="text-base font-semibold text-gray-800">{title}</span>
          {isFilled && !isOpen && (
            <span
              aria-label="Section has data"
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
            >
              ✓ Filled
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        hidden={!isOpen}
        className="px-6 py-5 bg-white border-t border-gray-200"
      >
        {children}
      </div>
    </div>
  )
}
