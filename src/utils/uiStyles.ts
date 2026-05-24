// UI Style Constants for consistent design system
export const UI_STYLES = {
  // Primary button (large, with shadow and icon support)
  primaryButton: 'px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed',

  // Secondary button (smaller, no shadow)
  secondaryButton: 'px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors',
  secondaryButtonNeutral: 'px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors',
  backButton: 'px-6 py-3 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600',

  // Tag/badge styles
  tag: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium',
  tagWithPadding: 'px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium',

  // Add button (for forms)
  addButton: 'px-3 py-1.5 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center space-x-1',

  // Focus ring for form inputs
  focusRing: 'focus:ring-2 focus:ring-emerald-500 focus:border-transparent',

  // Shared surfaces and typography
  surfaceCard: 'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700',
  heading: 'text-gray-900 dark:text-gray-100',
  mutedText: 'text-gray-600 dark:text-gray-300',
  label: 'text-sm font-semibold text-gray-700 dark:text-gray-200',
  input: 'w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors',
  inputError: 'w-full px-4 py-3 border border-red-500 dark:border-red-500/70 rounded-lg bg-red-50/50 dark:bg-red-950/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors',

  // Container spacing
  containerSpacing: 'p-6 sm:p-8',
} as const;