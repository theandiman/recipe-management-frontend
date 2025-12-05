import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getRecipes, deleteRecipe } from '../../services/recipeStorageApi'
import RecipeCard from '../../components/RecipeCard'
import type { Recipe } from '../../types/nutrition'

// Skeleton loading component
const SkeletonCard: React.FC = () => (
  <motion.div 
    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="h-40 sm:h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
    <div className="p-3 sm:p-4 space-y-3">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16 animate-pulse"></div>
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    </div>
  </motion.div>
)

export const RecipeLibrary: React.FC = () => {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  // Search & filter
  const [searchText, setSearchText] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  // Default page size chosen to not break existing tests (keeps small lists on single page)
  const [pageSize] = useState(20)

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getRecipes()
        console.log('Fetched recipes:', data)
        setRecipes(data)
      } catch (err: any) {
        console.error('Failed to fetch recipes:', err)
        setError(err.response?.data?.message || err.message || 'Failed to load recipes')
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [])

  // Delete is handled via onDelete prop from RecipeCard

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      setDeleting(true)
      await deleteRecipe(deleteConfirm.id)
      // Remove from local state
      setRecipes(recipes.filter(r => r.id !== deleteConfirm.id))
      setDeleteConfirm(null)
    } catch (err: any) {
      console.error('Failed to delete recipe:', err)
      setError(err.response?.data?.message || err.message || 'Failed to delete recipe')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm(null)
  }

  const tags = React.useMemo(() => Array.from(new Set(recipes.flatMap(r => r.tags || []))).filter(Boolean), [recipes])

  const filtered = React.useMemo(() => recipes.filter(r => {
    const text = searchText.trim().toLowerCase()
    const matchesText = !text || (r.recipeName || '').toLowerCase().includes(text) || (r.description || '').toLowerCase().includes(text) || (r.tags || []).some((t: string) => t.toLowerCase().includes(text))
    const matchesTag = !selectedTag || (r.tags || []).includes(selectedTag)
    return matchesText && matchesTag
  }), [recipes, searchText, selectedTag])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipe Library</h1>
          <p className="text-gray-600">Browse and manage your recipe collection</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: "easeOut",
                delay: index * 0.1 
              }}
            >
              <SkeletonCard />
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipe Library</h1>
          <p className="text-gray-600">Browse and manage your recipe collection</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error loading recipes</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (recipes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Recipe Library</h1>
          <p className="text-sm md:text-base text-gray-600">Browse and manage your recipe collection</p>
        </div>
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.svg 
            className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </motion.svg>
          <motion.h3 
            className="mt-4 text-base sm:text-lg font-medium text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            No recipes yet
          </motion.h3>
          <motion.p 
            className="mt-2 text-sm sm:text-base text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            Get started by generating your first recipe!
          </motion.p>
        </motion.div>
      </div>
    )
  }

  // Filter recipes by search and tag - handled via `filtered` declared above to avoid duplicate declarations

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Recipe Library</h1>
        <p className="text-sm md:text-base text-gray-600">Showing {filtered.length} of {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} in your collection</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
          <label htmlFor="search" className="sr-only">Search recipes</label>
          <input
            id="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by title, description or tag..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />

          <label htmlFor="tag-filter" className="sr-only">Filter by tag</label>
          <select
            id="tag-filter"
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            <option value="">All tags</option>
            {tags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Paged recipes */}
      {(() => {
        const total = filtered.length
        const totalPages = Math.max(1, Math.ceil(total / pageSize))
        if (currentPage > totalPages) setCurrentPage(1)
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        const paged = filtered.slice(start, end)

        return (
          <>
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentPage}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {paged.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onView={(id) => navigate(`/dashboard/recipes/${id}`)}
                    onDelete={(r) => r.id && setDeleteConfirm({ id: r.id, title: r.recipeName })}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

              {/* Empty filtered state */}
              {filtered.length === 0 && (
                <div className="mt-6 text-center text-gray-600">No recipes match your search or selected tag.</div>
              )}

            {/* Pagination controls */}
            {filtered.length > pageSize && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {Math.min(start + 1, total)} - {Math.min(end, total)} of {total}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    Previous
                  </button>

                  {/* Simple page number buttons */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      aria-current={p === currentPage}
                      className={`px-3 py-1 rounded ${p === currentPage ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}
                      aria-label={`Go to page ${p}`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )
      })()}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 sm:p-3 mr-3 sm:mr-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete Recipe</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-gray-700 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?
            </p>

            <div className="flex gap-2 sm:gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2.5 sm:py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
