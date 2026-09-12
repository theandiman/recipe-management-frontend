import React, { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface FilterTypeaheadComboboxProps {
  label: string
  placeholder?: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  icon?: React.ReactNode
  quickOptions?: string[]
  allowCustom?: boolean
  id?: string
  chipColor?: 'emerald' | 'indigo' | 'amber'
}

export const FilterTypeaheadCombobox: React.FC<FilterTypeaheadComboboxProps> = ({
  label,
  placeholder = 'Type to search...',
  options,
  selected,
  onChange,
  icon,
  quickOptions = [],
  allowCustom = false,
  id: customId,
  chipColor = 'emerald',
}) => {
  const generatedId = useId()
  const inputId = customId || generatedId
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter options based on query
  const filteredOptions = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return options
    }
    return options.filter(opt => opt.toLowerCase().includes(q))
  }, [options, query])

  // Helper to sanitize options and tags (disallow commas for URL compatibility)
  const sanitizeOption = (text: string) => text.replace(/,/g, '').trim()

  // Can add custom option if allowed and not already in options or selected
  const cleanedQuery = sanitizeOption(query)
  const canAddCustom =
    allowCustom &&
    cleanedQuery.length > 0 &&
    !options.some(opt => opt.toLowerCase() === cleanedQuery.toLowerCase()) &&
    !selected.some(sel => sel.toLowerCase() === cleanedQuery.toLowerCase())

  // Close dropdown on outside click (only listen when open)
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const toggleOption = (option: string) => {
    const trimmed = option.trim()
    if (!trimmed) return
    const isSelected = selected.some(s => s.toLowerCase() === trimmed.toLowerCase())
    if (isSelected) {
      onChange(selected.filter(s => s.toLowerCase() !== trimmed.toLowerCase()))
    } else {
      onChange([...selected, trimmed])
    }
    setQuery('')
    inputRef.current?.focus()
  }

  const addCustomOption = (text: string) => {
    const cleaned = sanitizeOption(text)
    if (!cleaned) return
    toggleOption(cleaned)
  }

  const removeOption = (option: string) => {
    onChange(selected.filter(s => s.toLowerCase() !== option.toLowerCase()))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      const maxIndex = filteredOptions.length + (canAddCustom ? 1 : 0) - 1
      if (maxIndex >= 0) {
        setHighlightedIndex(prev => (prev < maxIndex ? prev + 1 : 0))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      const maxIndex = filteredOptions.length + (canAddCustom ? 1 : 0) - 1
      if (maxIndex >= 0) {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : maxIndex))
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (!isOpen && cleanedQuery) {
        setIsOpen(true)
        return
      }
      if (canAddCustom && highlightedIndex === filteredOptions.length) {
        addCustomOption(cleanedQuery)
      } else if (filteredOptions[highlightedIndex]) {
        toggleOption(filteredOptions[highlightedIndex])
      } else if (cleanedQuery && allowCustom) {
        addCustomOption(cleanedQuery)
      }
    } else if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeOption(selected[selected.length - 1])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const chipColorClasses = {
    emerald:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    indigo:
      'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    amber:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  }[chipColor]

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={inputId} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {icon && <span className="text-sm">{icon}</span>}
          <span>{label}</span>
        </label>
        {selected.length > 0 && (
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Input Field */}
      <div
        onClick={() => {
          inputRef.current?.focus()
          setIsOpen(true)
        }}
        className="min-h-[42px] px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all flex flex-wrap items-center gap-1.5 cursor-text shadow-2xs"
      >
        {selected.map(item => (
          <span
            key={item}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-lg border ${chipColorClasses}`}
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                removeOption(item)
              }}
              className="text-gray-400 hover:text-red-500 focus:outline-none transition-colors ml-0.5 cursor-pointer"
              aria-label={`Remove ${item}`}
            >
              ✕
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setHighlightedIndex(0)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none py-1"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />

        {query && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              setQuery('')
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs px-1 cursor-pointer"
            title="Clear text"
          >
            ✕
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-white dark:bg-slate-850 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 text-xs"
          >
            {filteredOptions.length === 0 && !canAddCustom ? (
              <div className="px-3 py-2 text-gray-400 dark:text-gray-500 text-center">
                No matching options found
              </div>
            ) : (
              <>
                {filteredOptions.map((opt, idx) => {
                  const isSelected = selected.some(s => s.toLowerCase() === opt.toLowerCase())
                  const isHighlighted = idx === highlightedIndex
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}

                {canAddCustom && (
                  <button
                    type="button"
                    onClick={() => addCustomOption(cleanedQuery)}
                    onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                    className={`w-full flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-slate-800 text-left transition-colors cursor-pointer ${
                      highlightedIndex === filteredOptions.length
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Add "<strong>{cleanedQuery}</strong>"</span>
                    <span className="text-xs font-semibold">+</span>
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Select Pills (e.g. popular diets or quick tags) */}
      {quickOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mr-1">
            Popular:
          </span>
          {quickOptions.map(opt => {
            const isSelected = selected.some(s => s.toLowerCase() === opt.toLowerCase())
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(opt)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {isSelected ? `✓ ${opt}` : `+ ${opt}`}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
