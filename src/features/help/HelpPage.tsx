import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export interface HelpSection {
  id: string
  category: 'started' | 'ai' | 'library' | 'cooking' | 'nutrition' | 'community'
  title: string
  keywords: string[]
  icon: React.ReactNode
  content: React.ReactNode
}

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <motion.svg
    className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    animate={{ rotate: isOpen ? 180 : 0 }}
    transition={{ duration: 0.2 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </motion.svg>
)

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    category: 'started',
    title: 'Getting Started & Dashboard',
    keywords: ['dashboard', 'navigation', 'theme', 'dark mode', 'overview'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          Welcome to <strong>CookFlow</strong> — your AI-powered culinary companion. Here is a quick breakdown of your workspace:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li>
            <strong>Dashboard</strong> — Your central hub showing recipe statistics, recent creations, and fast action cards.
          </li>
          <li>
            <strong>Command Palette (⌘K)</strong> — Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded">⌘K</kbd> or <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded">Ctrl+K</kbd> anywhere to open instant search.
          </li>
          <li>
            <strong>Theme Toggle</strong> — Switch seamlessly between Dark Mode and Light Mode using the moon/sun toggle in the header or sidebar.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'command-palette',
    category: 'started',
    title: 'Command Palette & Quick Search (⌘K)',
    keywords: ['command palette', 'search', 'shortcut', 'omnisearch', 'recent'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          The <strong>OmniSearch Command Palette</strong> lets you jump to any recipe, tag, or AI feature instantly:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><strong>Keyboard Shortcut:</strong> Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded">⌘K</kbd> (Mac) or <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded">Ctrl+K</kbd> (Windows).</li>
          <li><strong>Live Match:</strong> Type to search titles, ingredients, and tags in real time.</li>
          <li><strong>Recent History:</strong> Revisit your last 5 search queries with 1 click.</li>
          <li><strong>✨ Ask AI Kitchen:</strong> Execute natural language AI searches directly inside the modal.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'ai-semantic-search',
    category: 'ai',
    title: '✨ Direct AI Semantic Search & Ranking',
    keywords: ['ai search', 'semantic search', 'natural language', 'ranking', 'match reason', 'ideas'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          Instead of forcing rigid keywords, <strong>AI Semantic Search</strong> evaluates your query contextually against your entire cookbook:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><strong>Natural Language Prompts:</strong> Type descriptions like <em>"cozy soup for a rainy night"</em> or <em>"quick dinner with leftover chicken"</em>.</li>
          <li><strong>Direct AI Ranking:</strong> Gemini AI scores your recipes by overall contextual fit.</li>
          <li><strong>✨ AI Match Reasons:</strong> Each card displays a 1-sentence badge explaining why it matched (e.g. <em>"Warm 20-min chicken meal"</em>).</li>
          <li><strong>✨ 1-Click Recipe Ideas:</strong> If no saved recipe fits well, Gemini suggests a custom AI recipe idea ready to generate in 1 click.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'ai-generator-audit',
    category: 'ai',
    title: '✨ AI Generator & Interactive Audit Trail',
    keywords: ['ai generator', 'ingredient normalization', 'audit trail', 'undo', 'suggestions', 'prompt'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          The <strong>AI Recipe Generator & Smart Editor</strong> assists in creating and refining recipes:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><strong>AI Recipe Generation:</strong> Describe a dish or enter available ingredients to draft a complete recipe.</li>
          <li><strong>Ingredient Normalization:</strong> Standardizes ingredient amounts and units automatically (e.g. <em>"2 large cloves garlic"</em>).</li>
          <li><strong>Smart Field Suggestions:</strong> AI offers title, description, and tag refinements as you type.</li>
          <li><strong>✨ Interactive AI Audit Trail:</strong> Review every accepted AI suggestion in an interactive timeline with full <strong>Undo / Redo</strong> controls.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'recipe-library',
    category: 'library',
    title: 'Browsing Your Recipe Library',
    keywords: ['library', 'recipes', 'filters', 'tags', 'drawer', 'calories', 'prep time'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          The <strong>My Cookbook</strong> page houses all your saved recipes with rich filtering controls:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><strong>Search Input:</strong> Instant keyword filtering across titles and ingredients.</li>
          <li><strong>Filter Drawer:</strong> Slide open advanced filters to constrain maximum prep time, calorie caps, or dietary tags.</li>
          <li><strong>Card Badges:</strong> View total time, serving count, and public sharing indicators on every card.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'create-edit-recipe',
    category: 'library',
    title: 'Creating, Editing & Public Privacy',
    keywords: ['create', 'edit', 'delete', 'privacy', 'public', 'private'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          Easily build or edit recipes step-by-step:
        </p>
        <ol className="list-decimal list-inside space-y-2 ml-1">
          <li><strong>Basic Info & Privacy:</strong> Title, description, servings, and <strong>Public Privacy Toggle</strong> (share with community).</li>
          <li><strong>Ingredients:</strong> Quantity, unit, and item name with drag-and-drop reordering.</li>
          <li><strong>Instructions:</strong> Step-by-step cooking directions.</li>
          <li><strong>Nutrition:</strong> Manual entry or AI Nutrition Estimation.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'cooking-mode-voice',
    category: 'cooking',
    title: '🍳 Cooking Mode & Hands-Free Voice Controls',
    keywords: ['cooking mode', 'voice control', 'voice commands', 'servings stepper', 'checklist', 'timer'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          <strong>Cooking Mode</strong> provides a distraction-free, full-screen environment designed for the kitchen:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><strong>🎙️ Hands-Free Voice Commands:</strong> Enable the microphone icon to navigate hands-free while cooking!</li>
          <li><strong>Dynamic Servings Stepper:</strong> Adjust servings on the fly—ingredient quantities automatically scale in real time!</li>
          <li><strong>Interactive Checklist:</strong> Check off ingredients as you prepare them.</li>
        </ul>
        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs mb-1.5">🎙️ Supported Voice Commands:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-emerald-900 dark:text-emerald-200">
            <div>• <code>"Next step"</code> or <code>"Forward"</code></div>
            <div>• <code>"Previous step"</code> or <code>"Back"</code></div>
            <div>• <code>"Repeat step"</code> or <code>"Read step"</code></div>
            <div>• <code>"Read ingredients"</code></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'nutrition-estimation',
    category: 'nutrition',
    title: '🥗 Nutrition Facts & AI Nutrition Estimation',
    keywords: ['nutrition', 'calories', 'fda label', 'ai estimate', 'macros', 'protein', 'carbs'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          Track macro and micronutrients with ease:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><strong>FDA-Style Label:</strong> Standardized Nutrition Label displaying Calories, Fats, Sodium, Carbs, Fiber, Sugars, and Protein.</li>
          <li><strong>✨ AI Nutrition Calculator:</strong> Click <em>"Estimate with AI"</em> on any recipe form to calculate nutritional breakdown automatically from ingredient text!</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'community-sharing',
    category: 'community',
    title: '👥 Community Hub, Likes & Bookmarks',
    keywords: ['community', 'social', 'likes', 'bookmarks', 'profiles', 'share'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          Connect with home chefs across the community:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1">
          <li><strong>Community Feed:</strong> Discover public recipes created by other home cooks.</li>
          <li><strong>Bookmarks & Likes:</strong> Save public recipes to your personal bookmarks or show appreciation with likes.</li>
          <li><strong>Creator Profiles:</strong> Click an author's name to view their public cookbook (`/user/:uid`).</li>
        </ul>
      </div>
    ),
  },
]

const AccordionItem: React.FC<{
  section: HelpSection
  isOpen: boolean
  onToggle: () => void
  index: number
}> = ({ section, isOpen, onToggle, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.3 }}
    className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-gray-200 dark:border-slate-700/80 overflow-hidden"
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-expanded={isOpen}
    >
      <div className="flex items-center space-x-3 min-w-0">
        <div className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">{section.icon}</div>
        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">{section.title}</span>
      </div>
      <ChevronIcon isOpen={isOpen} />
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-slate-700/80">{section.content}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
)

export const HelpPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['getting-started', 'ai-semantic-search']))

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredSections = useMemo(() => {
    return helpSections.filter(section => {
      const matchesCategory = activeCategory === 'all' || section.category === activeCategory
      if (!matchesCategory) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        section.title.toLowerCase().includes(q) ||
        section.keywords.some(k => k.toLowerCase().includes(q))
      )
    })
  }, [searchQuery, activeCategory])

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl mx-auto pb-12"
    >
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">Help & Documentation Center</h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Everything you need to master CookFlow — from AI Semantic Search to Hands-Free Cooking Mode.
          </p>

          {/* Real-time Documentation Search Input */}
          <div className="mt-5 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search help topics (e.g. voice, AI, nutrition, shortcuts)..."
              className="w-full pl-10 pr-10 py-3 bg-white/90 dark:bg-slate-900/90 text-gray-900 dark:text-gray-100 placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-inner"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Topics' },
          { id: 'started', label: '🚀 Getting Started' },
          { id: 'ai', label: '✨ AI Features' },
          { id: 'cooking', label: '🍳 Cooking & Voice' },
          { id: 'library', label: '📖 Recipe Library' },
          { id: 'nutrition', label: '🥗 Nutrition' },
          { id: 'community', label: '👥 Community' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredSections.length > 0 ? (
          filteredSections.map((section, index) => (
            <AccordionItem
              key={section.id}
              section={section}
              isOpen={openSections.has(section.id) || searchQuery.trim().length > 0}
              onToggle={() => toggleSection(section.id)}
              index={index}
            />
          ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500">
            No documentation topics match "{searchQuery}". Try searching for <em>"AI"</em>, <em>"voice"</em>, or <em>"search"</em>.
          </div>
        )}
      </div>

      {/* Quick Action Footer CTAs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-700 p-6 text-center space-y-4">
        <p className="text-gray-700 dark:text-gray-200 font-semibold text-base">Ready to get cooking?</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => navigate('/dashboard/create')}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Create a Recipe
          </button>
          <button
            onClick={() => navigate('/dashboard/generate')}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-xs"
          >
            ✨ Try AI Generator
          </button>
          <button
            onClick={() => navigate('/dashboard/recipes')}
            className="px-5 py-2.5 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Browse Library
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default HelpPage
