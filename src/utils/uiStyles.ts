// UI Style Constants for consistent design system
export const UI_STYLES = {
  // Primary button (large, with shadow and icon support)
  primaryButton: 'px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed',

  // Secondary button (smaller, no shadow)
  secondaryButton: 'px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors',

  // Tag/badge styles
  tag: 'bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium',
  tagWithPadding: 'px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium',

  // Add button (for forms)
  addButton: 'px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center space-x-1',

  // Focus ring for form inputs
  focusRing: 'focus:ring-2 focus:ring-emerald-500 focus:border-transparent',

  // Container spacing
  containerSpacing: 'p-6 sm:p-8',
} as const;