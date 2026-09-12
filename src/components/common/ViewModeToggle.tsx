import React from 'react'

export type ViewMode = 'grid' | 'list'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  showLabels?: boolean
  className?: string
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  showLabels = true,
  className = '',
}) => {
  return (
    <div
      role="group"
      aria-label="View mode selection"
      className={`flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 ${className}`}
    >
      <button
        type="button"
        onClick={() => onViewModeChange('grid')}
        aria-pressed={viewMode === 'grid'}
        title="Grid View"
        className={`flex items-center gap-1.5 ${showLabels ? 'px-3 py-1.5' : 'p-1.5'} rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          viewMode === 'grid'
            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
        {showLabels && <span>Grid</span>}
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('list')}
        aria-pressed={viewMode === 'list'}
        title="List View"
        className={`flex items-center gap-1.5 ${showLabels ? 'px-3 py-1.5' : 'p-1.5'} rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          viewMode === 'list'
            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {showLabels && <span>List</span>}
      </button>
    </div>
  )
}
