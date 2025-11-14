import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRecipes, deleteRecipe, type RecipeResponse } from '../../services/recipeStorageApi'

export const RecipeLibrary: React.FC = () => {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<RecipeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filterText, setFilterText] = useState('')

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

  const handleDeleteClick = (e: React.MouseEvent, recipe: RecipeResponse) => {
    e.stopPropagation() // Prevent card click navigation
    setDeleteConfirm({ id: recipe.id, title: recipe.title })
  }

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipe Library</h1>
          <p className="text-gray-600">Browse and manage your recipe collection</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-base sm:text-lg font-medium text-gray-900">No recipes yet</h3>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Get started by generating your first recipe!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Recipe Library</h1>
        <p className="text-sm md:text-base text-gray-600">{recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} in your collection</p>
        <div className="mt-3">
          <label htmlFor="recipe-filter" className="sr-only">Filter recipes</label>
          <div className="relative max-w-md">
            <input
              id="recipe-filter"
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter recipes by title, description or tag..."
              className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                aria-label="Clear filter"
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtered list (filter only affects displayed items; count above shows total in collection) */}
      {(() => {
        const q = filterText.trim().toLowerCase()
        const filtered = q
          ? recipes.filter(r => {
              if (r.title?.toLowerCase().includes(q)) return true
              if (r.description?.toLowerCase().includes(q)) return true
              if (r.tags && r.tags.some(t => t.toLowerCase().includes(q))) return true
              return false
            })
          : recipes

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative group"
          >
            {/* Delete button - always visible on mobile (opacity 100), hover on desktop */}
            <button
              onClick={(e) => handleDeleteClick(e, recipe)}
              className="absolute top-3 right-3 z-10 bg-red-500 text-white p-2.5 md:p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 active:bg-red-700"
              title="Delete recipe"
              aria-label={`Delete ${recipe.title}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <div
              onClick={() => navigate(`/dashboard/recipes/${recipe.id}`)}
              className="cursor-pointer"
            >
              {recipe.imageUrl ? (
                <div className="h-40 sm:h-48 overflow-hidden">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {(recipe.prepTime || recipe.cookTime) && (
                    <span className="flex items-center">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                    </span>
                  )}
                  <span className="flex items-center">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {recipe.servings} servings
                  </span>
                </div>
              </div>
            </div>
          </div>
            ))}
          </div>
        )
      })()}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6">
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
          </div>
        </div>
      )}
    </div>
  )
}
