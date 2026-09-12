import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface AiSearchPromptBarProps {
  isOpen: boolean
  onClose: () => void
  activePrompt?: string
  nlpSummary?: string | null
  isLoading?: boolean
  onSubmitPrompt: (prompt: string) => void
  onClearPrompt: () => void
}

const PROMPT_SUGGESTIONS = [
  'Quick dinner under 30 mins',
  'Low-carb and keto friendly',
  'High protein vegan meal',
  'Healthy dinner under 400 kcal',
  'Comfort food with cheese and garlic',
]

export const AiSearchPromptBar: React.FC<AiSearchPromptBarProps> = ({
  isOpen,
  onClose,
  activePrompt = '',
  nlpSummary = null,
  isLoading = false,
  onSubmitPrompt,
  onClearPrompt,
}) => {
  const [promptText, setPromptText] = useState(activePrompt)

  useEffect(() => {
    setPromptText(activePrompt)
  }, [activePrompt])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (promptText.trim()) {
      onSubmitPrompt(promptText.trim())
    }
  }

  const handleChipClick = (suggestion: string) => {
    setPromptText(suggestion)
    onSubmitPrompt(suggestion)
  }

  const handleClear = () => {
    setPromptText('')
    onClearPrompt()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden mb-4"
        >
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20 border border-emerald-500/25 rounded-2xl shadow-xs space-y-4">
            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">✨</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Smart AI Recipe Search
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
                    Describe what you're craving, ingredients on hand, or dietary goals in plain English.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close AI search bar"
                title="Close AI search bar"
              >
                ✕
              </button>
            </div>

            {/* Prompt Input Form */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g. Quick 20-min dinner with chicken and spinach under 500 calories..."
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-8 py-2 text-xs sm:text-sm border border-emerald-300 dark:border-emerald-700/60 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xs"
                />
                {promptText && (
                  <button
                    type="button"
                    onClick={() => setPromptText('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-red-500 text-xs font-bold"
                    aria-label="Clear prompt text"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !promptText.trim()}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <span>Ask AI</span>
                      <span>➔</span>
                    </>
                  )}
                </button>

                {activePrompt && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-2 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs sm:text-sm font-medium rounded-xl transition-colors"
                  >
                    Clear AI
                  </button>
                )}
              </div>
            </form>

            {/* Quick Inspiration Chips */}
            <div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mr-2">
                Try asking:
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1.5">
                {PROMPT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleChipClick(suggestion)}
                    className="px-2.5 py-1 text-[11px] rounded-full bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    ✨ {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Active AI criteria summary banner */}
            {activePrompt && nlpSummary && (
              <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-emerald-800 dark:text-emerald-300">
                  <span className="font-semibold">Active AI Filter:</span> "{activePrompt}" &bull; {nlpSummary}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
