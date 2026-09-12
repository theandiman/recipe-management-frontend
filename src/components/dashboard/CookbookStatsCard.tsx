import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSavedRecipes } from '../../features/recipes/SavedRecipesContext'

export interface CookbookStatsCardProps {
  recipesCount: number
  loading?: boolean
}

export const CookbookStatsCard: React.FC<CookbookStatsCardProps> = ({
  recipesCount,
  loading = false,
}) => {
  const navigate = useNavigate()
  const { savedRecipes } = useSavedRecipes()

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-700 p-5 transition-colors"
      aria-labelledby="cookbook-snapshot-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 id="cookbook-snapshot-heading" className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Cookbook Snapshot
          </h2>
        </div>

        <button
          onClick={() => navigate('/dashboard/recipes')}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
        >
          My Cookbook →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          onClick={() => navigate('/dashboard/recipes')}
          className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
        >
          <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block mb-0.5">
            Recipes Created
          </span>
          <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {loading ? '—' : recipesCount}
          </span>
        </div>

        <div
          onClick={() => navigate('/dashboard/saved')}
          className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/30 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all"
        >
          <span className="text-[11px] font-medium text-blue-800 dark:text-blue-300 block mb-0.5">
            Saved to Make
          </span>
          <span className="text-xl font-extrabold text-blue-700 dark:text-blue-400">
            {savedRecipes.length}
          </span>
        </div>
      </div>

      {/* Quick Discovery & Creation Links */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700/60 text-xs">
        <button
          onClick={() => navigate('/dashboard/community')}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-slate-750 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-center transition-colors cursor-pointer truncate"
        >
          Explore Community
        </button>
        <button
          onClick={() => navigate('/dashboard/create')}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-slate-750 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-center transition-colors cursor-pointer truncate"
        >
          + New Recipe
        </button>
      </div>
    </motion.section>
  )
}

export default CookbookStatsCard
