import React, { useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRecipeForm } from './hooks/useRecipeForm'
import { useRecipeValidation } from './hooks/useRecipeValidation'
import { useRecipeSave } from './hooks/useRecipeSave'
import { CollapsibleSection } from './components/CollapsibleSection'
import { IngredientInput } from '../../components/IngredientInput'
import { UI_STYLES } from '../../utils/uiStyles'
import { clampedNumericHandler } from '../../utils/formUtils'
import { useSimpleCreateSections } from './hooks/useSimpleCreateSections'
import { useAISuggestions } from './hooks/useAISuggestions'
import { AISuggestionPanel } from './components/AISuggestionPanel'

export const SimpleCreateRecipe: React.FC = () => {
  const navigate = useNavigate()

  const form = useRecipeForm()
  const { validateForm, buildRecipeObject } = useRecipeValidation()
  const sections = useSimpleCreateSections()

  const { handleSubmit } = useRecipeSave({
    title: form.title,
    description: form.description,
    prepTime: form.prepTime,
    cookTime: form.cookTime,
    servings: form.servings,
    ingredients: form.ingredients,
    instructions: form.instructions,
    tags: form.tags,
    dietaryRestrictions: form.dietaryRestrictions,
    imagePreview: form.imagePreview,
    setFieldErrors: form.setFieldErrors,
    setStepsWithErrors: form.setStepsWithErrors,
    setSaveLoading: form.setSaveLoading,
    setSaveError: form.setSaveError,
    validateForm,
    buildRecipeObject,
    // No step navigation in simple form — no-op
    goToStep: () => {},
  })

  const handleCancel = useCallback(() => {
    navigate('/dashboard/recipes')
  }, [navigate])

  const {
    visibleSuggestions,
    status: suggestionStatus,
    error: suggestionError,
    fetchSuggestions,
    applySuggestion,
    dismissSuggestion,
  } = useAISuggestions()

  const buildSuggestionRequest = () => ({
    recipeName: form.title || undefined,
    description: form.description || undefined,
    prepTime: form.prepTime || undefined,
    cookTime: form.cookTime || undefined,
    servings: form.servings || undefined,
    tags: form.tags.length > 0 ? form.tags : undefined,
    ingredients: form.ingredients.filter(i => i.item.trim()).map(i =>
      [i.quantity, i.unit, i.item].filter(Boolean).join(' ')
    ),
    instructions: form.instructions.filter(i => i.trim()),
  })

  const fieldSetters: Partial<Record<string, (value: string) => void>> = useMemo(() => ({
    recipeName: form.setTitle,
    description: form.setDescription,
    prepTime: form.setPrepTime,
    cookTime: form.setCookTime,
    servings: form.setServings,
  }), [form.setTitle, form.setDescription, form.setPrepTime, form.setCookTime, form.setServings])

  const currentValues: Partial<Record<string, string>> = useMemo(() => ({
    recipeName: form.title,
    description: form.description,
    prepTime: form.prepTime,
    cookTime: form.cookTime,
    servings: form.servings,
  }), [form.title, form.description, form.prepTime, form.cookTime, form.servings])

  const handleEnhanceWithAI = () => {
    fetchSuggestions(buildSuggestionRequest())
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Recipe</h1>
          <button
            type="button"
            onClick={handleEnhanceWithAI}
            disabled={suggestionStatus === 'loading'}
            aria-label="Enhance recipe with AI"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {suggestionStatus === 'loading' ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span aria-hidden="true">✨</span>
            )}
            Enhance with AI
          </button>
        </div>

        {/* Entry-point mode toggle */}
        <nav
          className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 mb-6"
          aria-label="Recipe creation mode"
        >
          <Link
            to="/dashboard/create"
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
          >
            🧭 Guided (step-by-step)
          </Link>
          <Link
            to="/dashboard/create/simple"
            aria-current="page"
            className="px-4 py-2 rounded-md text-sm font-medium bg-white text-emerald-700 shadow-sm border border-gray-200"
          >
            ⚡ Quick entry
          </Link>
        </nav>

        <p className="text-sm text-gray-500">
          Fill in everything at once. Required fields are always visible; optional sections can be
          expanded as needed.
        </p>
      </div>

      {/* Save error banner */}
      {form.saveError && (
        <div
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
          role="alert"
        >
          <svg
            className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{form.saveError}</p>
          </div>
          <button
            type="button"
            onClick={() => form.setSaveError(null)}
            className="ml-3 text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <AISuggestionPanel
        suggestions={visibleSuggestions}
        status={suggestionStatus}
        error={suggestionError}
        onApply={applySuggestion}
        onDismiss={dismissSuggestion}
        fieldSetters={fieldSetters}
        currentValues={currentValues}
        onRetry={handleEnhanceWithAI}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ─── Required: Title ─── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Basic Info
          </h2>

          {/* Recipe Name */}
          <div className="mb-4">
            <label htmlFor="simple-title" className="block text-sm font-semibold text-gray-700 mb-2">
              Recipe Name <span className="text-red-500">*</span>
            </label>
            <input
              id="simple-title"
              type="text"
              value={form.title}
              onChange={(e) => {
                form.setTitle(e.target.value)
                if (e.target.value) form.clearFieldError('title', 1)
              }}
              placeholder="e.g., Grandma's Chocolate Chip Cookies"
              aria-required="true"
              aria-invalid={!!form.fieldErrors.title}
              aria-describedby={form.fieldErrors.title ? 'simple-title-error' : undefined}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                form.fieldErrors.title
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-emerald-500'
              }`}
            />
            {form.fieldErrors.title && (
              <p
                id="simple-title-error"
                className="mt-1 text-sm text-red-600 flex items-center"
                role="alert"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {form.fieldErrors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="simple-description"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="simple-description"
              value={form.description}
              onChange={(e) => form.setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of your recipe..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ─── Required: Ingredients ─── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Ingredients <span className="text-red-500">*</span>
          </h2>
          <IngredientInput
            ingredients={form.ingredients}
            onAddIngredient={form.addIngredient}
            onUpdateIngredient={form.updateIngredient}
            onRemoveIngredient={form.removeIngredient}
          />
          {form.fieldErrors.ingredients && (
            <div
              className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
              role="alert"
            >
              <svg
                className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">{form.fieldErrors.ingredients}</p>
            </div>
          )}
        </div>

        {/* ─── Required: Instructions ─── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Instructions <span className="text-red-500">*</span>
            </h2>
            <button type="button" onClick={form.addInstruction} className={UI_STYLES.addButton}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-3">
            {form.instructions.map((instruction, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold">
                    {index + 1}
                  </span>
                </span>
                <textarea
                  value={instruction}
                  onChange={(e) => form.updateInstruction(index, e.target.value)}
                  placeholder="Describe this step in detail..."
                  rows={2}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
                />
                {form.instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => form.removeInstruction(index)}
                    aria-label={`Remove step ${index + 1}`}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {form.fieldErrors.instructions && (
            <div
              className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
              role="alert"
            >
              <svg
                className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">{form.fieldErrors.instructions}</p>
            </div>
          )}
        </div>

        {/* ─── Optional sections ─── */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1">
            Optional sections
          </p>

          {/* ⏱ Timing */}
          <CollapsibleSection
            title="Timing"
            icon="⏱"
            isOpen={sections.timing.isOpen}
            isFilled={sections.timing.isFilled(form.prepTime, form.cookTime)}
            onToggle={sections.timing.toggle}
            data-testid="section-timing"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="simple-prep-time"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Prep Time (min)
                </label>
                <input
                  id="simple-prep-time"
                  type="number"
                  value={form.prepTime}
                  onChange={clampedNumericHandler(form.setPrepTime, 0, 999)}
                  min="0"
                  max="999"
                  step="1"
                  placeholder="15"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="simple-cook-time"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Cook Time (min)
                </label>
                <input
                  id="simple-cook-time"
                  type="number"
                  value={form.cookTime}
                  onChange={clampedNumericHandler(form.setCookTime, 0, 999)}
                  min="0"
                  max="999"
                  step="1"
                  placeholder="30"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* 🍽 Serving info */}
          <CollapsibleSection
            title="Serving Info"
            icon="🍽"
            isOpen={sections.serving.isOpen}
            isFilled={sections.serving.isFilled(form.servings)}
            onToggle={sections.serving.toggle}
            data-testid="section-serving"
          >
            <div>
              <label
                htmlFor="simple-servings"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Servings
              </label>
              <input
                id="simple-servings"
                type="number"
                value={form.servings}
                onChange={clampedNumericHandler(form.setServings, 1, 99)}
                min="1"
                max="99"
                step="1"
                placeholder="4"
                className="w-full sm:w-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </CollapsibleSection>

          {/* 🏷 Tags & dietary info */}
          <CollapsibleSection
            title="Tags & Dietary Info"
            icon="🏷"
            isOpen={sections.tags.isOpen}
            isFilled={sections.tags.isFilled(form.tags, form.dietaryRestrictions)}
            onToggle={sections.tags.toggle}
            data-testid="section-tags"
          >
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags (Optional)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={form.tagInput}
                    onChange={(e) => form.setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        form.addTag()
                      }
                    }}
                    placeholder="Add tags (e.g., 'quick', 'healthy', 'vegetarian')"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={form.addTag}
                    className={UI_STYLES.secondaryButton}
                  >
                    Add
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map((tag, index) => (
                      <span
                        key={tag}
                        className={`${UI_STYLES.tagWithPadding} inline-flex items-center`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => form.removeTag(index)}
                          className="ml-2 text-emerald-600 hover:text-emerald-800"
                          aria-label={`Remove tag ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dietary restrictions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dietary Restrictions (Optional)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={form.dietaryInput}
                    onChange={(e) => form.setDietaryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        form.addDietaryRestriction()
                      }
                    }}
                    placeholder="e.g., 'vegan', 'gluten-free', 'nut-free'"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={form.addDietaryRestriction}
                    className={UI_STYLES.secondaryButton}
                  >
                    Add
                  </button>
                </div>
                {form.dietaryRestrictions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.dietaryRestrictions.map((dr, index) => (
                      <span
                        key={dr}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium inline-flex items-center"
                      >
                        {dr}
                        <button
                          type="button"
                          onClick={() => form.removeDietaryRestriction(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          aria-label={`Remove dietary restriction ${dr}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* 📸 Photo */}
          <CollapsibleSection
            title="Photo"
            icon="📸"
            isOpen={sections.photo.isOpen}
            isFilled={sections.photo.isFilled(form.imagePreview)}
            onToggle={sections.photo.toggle}
            data-testid="section-photo"
          >
            {!form.imagePreview ? (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-10 h-10 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, or WEBP (max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={form.handleImageUpload}
                  />
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={form.imagePreview}
                  alt="Recipe preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={form.removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  aria-label="Remove image"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </CollapsibleSection>
        </div>

        {/* ─── Action bar ─── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-b-xl px-6 py-4 flex items-center justify-between gap-4 shadow-lg">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={form.saveLoading}
            className={`px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm ${
              form.saveLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {form.saveLoading ? (
              <span className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Saving…</span>
              </span>
            ) : (
              'Save Recipe'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
