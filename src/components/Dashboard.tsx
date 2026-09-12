import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getRecipes } from '../services/recipeStorageApi'
import RecipeCard from '../components/RecipeCard'
import { RecentRecipesSkeleton } from '../components/skeletons/RecentRecipesSkeleton'
import { DashboardGreeting } from './dashboard/DashboardGreeting'
import { FollowedCooksFeed } from './dashboard/FollowedCooksFeed'
import { RecentSocialActivity } from './dashboard/RecentSocialActivity'
import { SavedRecipeContinuation } from './dashboard/SavedRecipeContinuation'
import { NewUserOnboarding } from './dashboard/NewUserOnboarding'
import type { Recipe } from '../types/nutrition'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch current user's recipes
  useEffect(() => {
    let isMounted = true
    const fetchRecipes = async () => {
      try {
        const data = await getRecipes()
        if (isMounted) {
          setRecipes(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Failed to fetch recipes:', err)
        if (isMounted) {
          setRecipes([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchRecipes()
    return () => {
      isMounted = false
    }
  }, [])

  // Recent own recipes (last 3 created)
  const recentRecipes = useMemo(() => {
    if (recipes.length === 0) return []
    return [...recipes]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3)
  }, [recipes])

  const isNewUser = !loading && recipes.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Compact Greeting with Creation Entry Points */}
      <DashboardGreeting />

      {/* Onboarding Banner for users without recipes */}
      {isNewUser && <NewUserOnboarding />}

      {/* Main Social Home Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary Feed Column: Followed Cooks & Saved Recipes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Followed Cooks Feed */}
          <FollowedCooksFeed />

          {/* Continue with Saved Recipes */}
          <SavedRecipeContinuation />

          {/* Your Recent Recipes (Quick Access) */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-700 p-6 transition-colors"
            >
              <RecentRecipesSkeleton />
            </motion.div>
          ) : recentRecipes.length > 0 ? (
            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-gray-200 dark:border-slate-700 p-6 transition-colors"
              aria-labelledby="recent-recipes-heading"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 id="recent-recipes-heading" className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Your Recent Recipes
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Quickly return to your recent culinary creations
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard/recipes')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  View all in My Cookbook →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentRecipes.map((recipe) => (
                  <RecipeCard
                    key={`my-recent-${recipe.id}`}
                    recipe={recipe}
                    onView={(id) => navigate(`/dashboard/recipes/${id}`)}
                    compact
                    showBookmark
                    isOwner
                  />
                ))}
              </div>
            </motion.section>
          ) : null}
        </div>

        {/* Sidebar Column: Recent Social Activity */}
        <div className="lg:col-span-4 space-y-6">
          <RecentSocialActivity />
        </div>
      </div>
    </motion.div>
  )
}
