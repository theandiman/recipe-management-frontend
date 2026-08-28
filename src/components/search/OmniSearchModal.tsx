import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getRecipes } from '../../services/recipeStorageApi'
import { parseAiSearchIntent } from '../../utils/aiApi'
import type { Recipe } from '../../types/nutrition'

const RECENT_SEARCHES_KEY = 'recipe_search_history_v1'
const MAX_RECENT_SEARCHES = 5

export interface OmniSearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isAiSearching, setIsAiSearching] = useState(false)

  const handleAiSearch = async (searchPrompt: string) => {
    if (!searchPrompt.trim() || isAiSearching) return
    setIsAiSearching(true)
    saveRecentSearch(searchPrompt)

    try {
      const result = await parseAiSearchIntent(searchPrompt)
      onClose()

      const params = new URLSearchParams()
      if (result.queryKeywords) params.set('q', result.queryKeywords)
      if (result.dietaryTags && result.dietaryTags.length > 0) {
        params.set('tag', result.dietaryTags[0])
      }
      if (result.maxPrepTime) params.set('maxPrepTime', String(result.maxPrepTime))
      if (result.maxCalories) params.set('maxCalories', String(result.maxCalories))

      navigate(`/dashboard/recipes?${params.toString()}`)
    } catch (err) {
      console.error('AI search intent parsing failed:', err)
      onClose()
      navigate(`/dashboard/recipes?q=${encodeURIComponent(searchPrompt.trim())}`)
    } finally {
      setIsAiSearching(false)
    }
  }

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch {
      // Ignore storage errors
    }
  }, [isOpen])

  // Fetch recipes when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) setQuery(initialQuery)
      getRecipes()
        .then(data => setRecipes(data))
        .catch(err => console.error('OmniSearch failed to load recipes:', err))
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen, initialQuery])

  // Save query to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT_SEARCHES)
    setRecentSearches(updated)
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch {
      // Ignore storage errors
    }
  }

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore storage errors
    }
  }

  // Filter matching recipes and tags
  const filteredRecipes = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return recipes.filter(r => 
      (r.recipeName || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (r.ingredients || []).some(ing => (typeof ing === 'string' ? ing : (ing as { item?: string })?.item || '').toLowerCase().includes(q))
    ).slice(0, 6)
  }, [recipes, query])

  const matchingTags = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    const allTags = Array.from(new Set(recipes.flatMap(r => r.tags || []))).filter(Boolean)
    return allTags.filter(t => t.toLowerCase().includes(q)).slice(0, 4)
  }, [recipes, query])

  // Combine navigable results
  const totalItems = filteredRecipes.length + matchingTags.length

  const handleSelectRecipe = (recipeId: string, searchQuery?: string) => {
    if (searchQuery) saveRecentSearch(searchQuery)
    onClose()
    navigate(`/dashboard/recipes/${recipeId}`)
  }

  const handleSelectTag = (tag: string) => {
    saveRecentSearch(tag)
    onClose()
    navigate(`/dashboard/recipes?tag=${encodeURIComponent(tag)}`)
  }

  const handleSelectRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery)
  }

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (totalItems > 0) {
        setSelectedIndex(prev => (prev + 1) % totalItems)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (totalItems > 0) {
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (totalItems > 0) {
        if (selectedIndex < filteredRecipes.length) {
          const selected = filteredRecipes[selectedIndex]
          if (selected?.id) handleSelectRecipe(selected.id, query)
        } else {
          const tagIndex = selectedIndex - filteredRecipes.length
          const selectedTag = matchingTags[tagIndex]
          if (selectedTag) handleSelectTag(selectedTag)
        }
      } else if (query.trim()) {
        saveRecentSearch(query)
        onClose()
        navigate(`/dashboard/recipes?q=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Omni Search Command Palette"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10"
            onKeyDown={handleKeyDown}
          >
            {/* Input Header */}
            <div className="flex items-center px-4 py-3.5 border-b border-gray-200 dark:border-slate-800">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                placeholder="Search recipes, tags, ingredients... (Press Esc to exit)"
                className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md"
                  title="Clear query"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-slate-800 dark:text-gray-400 border border-gray-200 dark:border-slate-700 rounded shadow-xs">
                ESC
              </kbd>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
              {/* Recent Searches (when query is empty) */}
              {!query.trim() && (
                <div>
                  {recentSearches.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        <span>Recent Searches</span>
                        <button
                          onClick={clearRecentSearches}
                          className="hover:text-red-500 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="mt-1 space-y-1">
                        {recentSearches.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectRecentSearch(s)}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 rounded-xl text-left transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{s}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                      Type to search your cookbook by recipe name, tag, or ingredients...
                    </div>
                  )}
                </div>
              )}

              {/* AI Natural Language Search Suggestion Pill */}
              {query.trim().length > 3 && (
                <div className="px-3 mb-2">
                  <button
                    onClick={() => handleAiSearch(query)}
                    disabled={isAiSearching}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 hover:from-emerald-500/20 hover:to-indigo-500/20 border border-emerald-500/30 rounded-xl transition-all text-left group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="text-base flex-shrink-0">✨</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {isAiSearching ? 'AI is interpreting search intent...' : 'Ask AI Kitchen to search'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Parse "{query}" into smart dietary, prep time & calorie filters
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2">
                      {isAiSearching ? 'Parsing...' : 'Search with AI →'}
                    </span>
                  </button>
                </div>
              )}

              {/* Filtered Recipe Results */}
              {query.trim() && filteredRecipes.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Recipes ({filteredRecipes.length})
                  </div>
                  <div className="mt-1 space-y-1">
                    {filteredRecipes.map((recipe, idx) => {
                      const isSelected = selectedIndex === idx
                      return (
                        <div
                          key={recipe.id || idx}
                          onClick={() => recipe.id && handleSelectRecipe(recipe.id, query)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium'
                              : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {recipe.imageUrl ? (
                              <img
                                src={recipe.imageUrl}
                                alt={recipe.recipeName}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {recipe.recipeName[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm truncate">{recipe.recipeName}</p>
                              {recipe.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{recipe.description}</p>
                              )}
                            </div>
                          </div>
                          {recipe.prepTime && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
                              {recipe.prepTime} min
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Matching Tags */}
              {query.trim() && matchingTags.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Tags
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 px-3">
                    {matchingTags.map((tag, idx) => {
                      const absoluteIdx = filteredRecipes.length + idx
                      const isSelected = selectedIndex === absoluteIdx
                      return (
                        <button
                          key={tag}
                          onClick={() => handleSelectTag(tag)}
                          onMouseEnter={() => setSelectedIndex(absoluteIdx)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                          }`}
                        >
                          #{tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* No results */}
              {query.trim() && filteredRecipes.length === 0 && matchingTags.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recipes or tags found for "{query}"</p>
                  <button
                    onClick={() => {
                      onClose()
                      navigate(`/dashboard/generate?prompt=${encodeURIComponent(query)}`)
                    }}
                    className="mt-3 inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
                  >
                    ✨ Generate "{query}" with AI Kitchen
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-900/80 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-3">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-slate-800 rounded">↑</kbd><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-slate-800 rounded">↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-slate-800 rounded">↵</kbd> select</span>
              </div>
              <div>Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-slate-800 rounded">ESC</kbd> to exit</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
