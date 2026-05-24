import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface HelpSection {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <motion.svg
    className="w-5 h-5 text-gray-500 flex-shrink-0"
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
    title: 'Getting Started',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300">
        <p>
          Welcome to <strong>CookFlow</strong> — your personal recipe management app. Here's a quick overview of
          what you can do:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Dashboard</strong> — your home page, showing recipe stats and quick action shortcuts.
          </li>
          <li>
            <strong>Browse Recipes</strong> — view, search, and filter all the recipes in your library.
          </li>
          <li>
            <strong>Create Recipe</strong> — add a new recipe step-by-step using the guided form.
          </li>
          <li>
            <strong>AI Generator</strong> — let AI suggest a recipe based on ingredients or a description.
          </li>
        </ul>
        <p>
          Use the sidebar on the left to navigate between sections. On mobile, tap the menu icon (☰) at the top
          to open the sidebar.
        </p>
      </div>
    ),
  },
  {
    id: 'recipe-library',
    title: 'Browsing Your Recipe Library',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300">
        <p>
          The <strong>Browse Recipes</strong> page shows all the recipes you've saved. You can:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Search</strong> — type in the search box to filter recipes by name.
          </li>
          <li>
            <strong>Filter by tag</strong> — click a tag chip to show only recipes with that tag.
          </li>
          <li>
            <strong>View a recipe</strong> — click the <em>View</em> button on any card to open the full recipe
            detail.
          </li>
          <li>
            <strong>Delete a recipe</strong> — click the delete (trash) icon on a card and confirm the prompt to
            permanently remove it.
          </li>
        </ul>
        <p>
          Results are paginated. Use the page controls at the bottom to navigate between pages.
        </p>
      </div>
    ),
  },
  {
    id: 'create-recipe',
    title: 'Creating a Recipe',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300">
        <p>
          Click <strong>Create Recipe</strong> in the sidebar to open the step-by-step recipe builder. The form
          is split into four steps:
        </p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>
            <strong>Basic Info</strong> — enter the recipe name, a short description, servings count, and
            optional tags.
          </li>
          <li>
            <strong>Ingredients</strong> — add each ingredient with its quantity and unit. Click
            <em> Add ingredient</em> to add more rows.
          </li>
          <li>
            <strong>Instructions</strong> — write the cooking steps, one per line. Drag to reorder them.
          </li>
          <li>
            <strong>Nutrition (optional)</strong> — enter approximate nutritional values per serving.
          </li>
        </ol>
        <p>
          Use the <strong>Next</strong> / <strong>Back</strong> buttons to move between steps. Click{' '}
          <strong>Save Recipe</strong> on the final step to save it to your library.
        </p>
      </div>
    ),
  },
  {
    id: 'edit-recipe',
    title: 'Editing & Deleting Recipes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300">
        <p>To edit an existing recipe:</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>Open the recipe from <strong>Browse Recipes</strong> or the Dashboard.</li>
          <li>Click the <strong>Edit</strong> button on the recipe detail page.</li>
          <li>Update any fields using the same step-by-step form used for creating recipes.</li>
          <li>Click <strong>Save Changes</strong> to apply the updates.</li>
        </ol>
        <p>To delete a recipe:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Click the trash icon on a recipe card in the library, or the <strong>Delete</strong> button on the
            detail page.</li>
          <li>A confirmation dialog will appear — click <strong>Delete</strong> to confirm, or{' '}
            <strong>Cancel</strong> to go back.</li>
        </ul>
        <p className="text-amber-600 dark:text-amber-400 text-sm">⚠ Deletion is permanent and cannot be undone.</p>
      </div>
    ),
  },
  {
    id: 'ai-generator',
    title: 'Using the AI Recipe Generator',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300">
        <p>
          The <strong>AI Generator</strong> creates recipe ideas for you automatically. To use it:
        </p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>Click <strong>AI Generator</strong> in the sidebar.</li>
          <li>
            Describe what you'd like — for example, list some ingredients you have on hand, specify a cuisine,
            or mention dietary preferences.
          </li>
          <li>Click <strong>Generate</strong> and wait a moment for the AI to create your recipe.</li>
          <li>Review the generated recipe. If you're happy with it, click <strong>Save to Library</strong> to
            add it to your collection.</li>
        </ol>
        <p>
          You can generate a new recipe at any time — previous results are not saved automatically, so
          remember to save any recipes you want to keep.
        </p>
      </div>
    ),
  },
  {
    id: 'cooking-mode',
    title: 'Cooking Mode',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300">
        <p>
          <strong>Cooking Mode</strong> presents a distraction-free, step-by-step view of a recipe while you
          cook.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Open any recipe from your library and click <strong>Start Cooking</strong>.</li>
          <li>The ingredients list is shown on the left so you can check off items as you go.</li>
          <li>Use <strong>Previous Step</strong> / <strong>Next Step</strong> to move through the instructions.</li>
          <li>Adjust the <strong>Servings</strong> stepper to automatically scale ingredient quantities up or
            down.</li>
          <li>Click <strong>Exit Cooking Mode</strong> to return to the recipe detail page.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'account',
    title: 'Account & Sign Out',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    content: (
      <div className="space-y-3 text-gray-600 dark:text-gray-300">
        <p>
          Your account email is shown at the bottom of the sidebar. All recipes are stored privately and linked
          to your account.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Sign out</strong> — click the <em>Sign out</em> button at the bottom of the sidebar to log
            out of your account.
          </li>
          <li>
            <strong>Sign back in</strong> — visit the login page and enter your email and password.
          </li>
          <li>
            <strong>Create an account</strong> — click <em>Register</em> on the login page to sign up with an
            email address and password.
          </li>
        </ul>
        <p>
          Your session persists between visits, so you won't need to log in each time unless you explicitly sign
          out or your session expires.
        </p>
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
    transition={{ delay: index * 0.05, duration: 0.3 }}
    className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-expanded={isOpen}
    >
      <div className="flex items-center space-x-3">
        <div className="text-emerald-600">{section.icon}</div>
        <span className="font-medium text-gray-900 dark:text-gray-100">{section.title}</span>
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
          <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-slate-700">{section.content}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
)

export const HelpPage: React.FC = () => {
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['getting-started']))

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      {/* Page header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold mb-2">Help &amp; Documentation</h1>
          <p className="text-emerald-100 text-lg">
            Everything you need to know about using CookFlow.
          </p>
        </motion.div>
      </div>

      {/* Accordion sections */}
      <div className="space-y-3">
        {helpSections.map((section, index) => (
          <AccordionItem
            key={section.id}
            section={section}
            isOpen={openSections.has(section.id)}
            onToggle={() => toggle(section.id)}
            index={index}
          />
        ))}
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 text-center"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-4">Ready to get cooking?</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/create')}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Create a Recipe
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/recipes')}
            className="px-6 py-2.5 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded-lg font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            Browse Recipes
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
