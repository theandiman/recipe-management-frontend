/**
 * AI Suggestion Validation utilities for frontend guardrails.
 *
 * BDD Scenarios implemented:
 *   Scenario 1: Valid AI suggestion passes validation
 *   Scenario 2: Suggestions exceeding field length limits are caught
 *   Scenario 3: HTML/script content is sanitized before application
 *   Scenario 4: AI failures produce user-friendly errors (handled by callers)
 *   Scenario 5: Structural constraints enforced (servings, tags)
 *   Scenario 6: Validation failures tagged with 'ai_validation' for observability
 */

/** Observability tag for all AI validation failures — distinguish from manual validation. */
export const AI_VALIDATION_TAG = 'ai_validation'

export const AI_FIELD_LIMITS = {
  recipeName: { maxLength: 200 },
  description: { maxLength: 2000 },
  tag: { maxLength: 50 },
  tags: { maxCount: 20 },
  ingredient: { maxLength: 500 },
  ingredients: { maxCount: 100 },
  instruction: { maxLength: 2000 },
  instructions: { maxCount: 100 },
  servings: { min: 1, max: 100 },
} as const

export interface AISuggestionValidationResult {
  isValid: boolean
  errors: string[]
}

/** Pattern stripping script/style elements including their content */
const SCRIPT_STYLE_PATTERN = /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi
/** Pattern matching HTML tags for sanitization */
const HTML_TAG_PATTERN = /<[^>]*>/g
/** Pattern matching ASCII control characters (null bytes, etc.) */
const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

/**
 * Sanitizes a text string by stripping HTML tags and control characters.
 * Returns the original value if it is not a string.
 */
export function sanitizeAIText(value: string | null | undefined): string {
  if (value == null) return ''
  // First remove script/style elements including their inner content
  let result = value.replace(SCRIPT_STYLE_PATTERN, '')
  // Then strip any remaining HTML tags
  result = result.replace(HTML_TAG_PATTERN, '')
  result = result.replace(CONTROL_CHAR_PATTERN, '')
  return result
}

/**
 * Validates a single AI-suggested field value against the field's constraints.
 *
 * @param field - the recipe field name (e.g., 'recipeName', 'servings')
 * @param value - the suggested value from the AI
 * @returns validation result with isValid flag and error messages
 */
export function validateAISuggestionField(
  field: string,
  value: unknown
): AISuggestionValidationResult {
  const errors: string[] = []

  switch (field) {
    case 'recipeName': {
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push('recipeName is required and must not be empty')
      } else if (value.length > AI_FIELD_LIMITS.recipeName.maxLength) {
        errors.push(
          `recipeName exceeds maximum length of ${AI_FIELD_LIMITS.recipeName.maxLength} characters (got ${value.length})`
        )
      }
      break
    }

    case 'description': {
      if (value != null && typeof value === 'string' && value.length > AI_FIELD_LIMITS.description.maxLength) {
        errors.push(
          `description exceeds maximum length of ${AI_FIELD_LIMITS.description.maxLength} characters (got ${value.length})`
        )
      }
      break
    }

    case 'servings': {
      const n = typeof value === 'string' ? parseInt(value, 10) : value
      if (n != null) {
        if (typeof n !== 'number' || isNaN(n as number)) {
          errors.push('servings must be a number')
        } else if ((n as number) < AI_FIELD_LIMITS.servings.min || (n as number) > AI_FIELD_LIMITS.servings.max) {
          errors.push(
            `servings must be between ${AI_FIELD_LIMITS.servings.min} and ${AI_FIELD_LIMITS.servings.max} (got ${n})`
          )
        }
      }
      break
    }

    case 'tags': {
      if (Array.isArray(value)) {
        if (value.length > AI_FIELD_LIMITS.tags.maxCount) {
          errors.push(
            `tags list exceeds maximum of ${AI_FIELD_LIMITS.tags.maxCount} tags (got ${value.length})`
          )
        }
        value.forEach((tag: unknown) => {
          if (typeof tag === 'string' && tag.length > AI_FIELD_LIMITS.tag.maxLength) {
            errors.push(
              `tag "${tag.substring(0, 30)}${tag.length > 30 ? '...' : ''}" exceeds maximum length of ${AI_FIELD_LIMITS.tag.maxLength} characters`
            )
          }
        })
      }
      break
    }

    case 'ingredients': {
      if (Array.isArray(value)) {
        if (value.length > AI_FIELD_LIMITS.ingredients.maxCount) {
          errors.push(
            `ingredients list exceeds maximum of ${AI_FIELD_LIMITS.ingredients.maxCount} items (got ${value.length})`
          )
        }
        value.forEach((ing: unknown) => {
          if (typeof ing === 'string' && ing.length > AI_FIELD_LIMITS.ingredient.maxLength) {
            errors.push(`ingredient entry exceeds maximum length of ${AI_FIELD_LIMITS.ingredient.maxLength} characters`)
          }
        })
      }
      break
    }

    case 'instructions': {
      if (Array.isArray(value)) {
        if (value.length > AI_FIELD_LIMITS.instructions.maxCount) {
          errors.push(
            `instructions list exceeds maximum of ${AI_FIELD_LIMITS.instructions.maxCount} steps (got ${value.length})`
          )
        }
        value.forEach((step: unknown) => {
          if (typeof step === 'string' && step.length > AI_FIELD_LIMITS.instruction.maxLength) {
            errors.push(`instruction step exceeds maximum length of ${AI_FIELD_LIMITS.instruction.maxLength} characters`)
          }
        })
      }
      break
    }

    default:
      // Unknown fields are not validated — additive/non-breaking
      break
  }

  const isValid = errors.length === 0

  if (!isValid) {
    console.warn(`[${AI_VALIDATION_TAG}] Field "${field}" failed AI suggestion validation:`, errors)
  }

  return { isValid, errors }
}

/** Shape of a recipe object as returned by the AI service */
export interface AIRecipeSuggestion {
  recipeName?: unknown
  description?: unknown
  ingredients?: unknown
  instructions?: unknown
  servings?: unknown
  tags?: unknown
  [key: string]: unknown
}

/**
 * Validates an entire AI-generated recipe object against all field constraints.
 *
 * @param recipe - the raw AI-generated recipe payload
 * @returns combined validation result across all fields
 */
export function validateAISuggestion(recipe: AIRecipeSuggestion): AISuggestionValidationResult {
  const allErrors: string[] = []

  const fieldsToValidate: Array<keyof AIRecipeSuggestion> = [
    'recipeName',
    'description',
    'servings',
    'tags',
    'ingredients',
    'instructions',
  ]

  for (const field of fieldsToValidate) {
    const result = validateAISuggestionField(field as string, recipe[field])
    allErrors.push(...result.errors)
  }

  const isValid = allErrors.length === 0

  if (!isValid) {
    console.warn(
      `[${AI_VALIDATION_TAG}] AI recipe suggestion failed validation with ${allErrors.length} violation(s):`,
      allErrors
    )
  }

  return { isValid, errors: allErrors }
}

/**
 * Sanitizes all text fields in an AI-generated recipe.
 * Returns a new object; the original is not mutated.
 *
 * @param recipe - the raw AI-generated recipe payload
 * @returns a new recipe object with sanitized text fields
 */
export function sanitizeAISuggestion(recipe: AIRecipeSuggestion): AIRecipeSuggestion {
  const sanitized: AIRecipeSuggestion = { ...recipe }

  if (typeof sanitized.recipeName === 'string') {
    sanitized.recipeName = sanitizeAIText(sanitized.recipeName)
  }

  if (typeof sanitized.description === 'string') {
    sanitized.description = sanitizeAIText(sanitized.description)
  }

  if (Array.isArray(sanitized.ingredients)) {
    sanitized.ingredients = sanitized.ingredients.map((ing: unknown) =>
      typeof ing === 'string' ? sanitizeAIText(ing) : ing
    )
  }

  if (Array.isArray(sanitized.instructions)) {
    sanitized.instructions = sanitized.instructions.map((step: unknown) =>
      typeof step === 'string' ? sanitizeAIText(step) : step
    )
  }

  if (Array.isArray(sanitized.tags)) {
    sanitized.tags = sanitized.tags.map((tag: unknown) =>
      typeof tag === 'string' ? sanitizeAIText(tag) : tag
    )
  }

  return sanitized
}

/**
 * Produces a user-friendly error message for an AI service failure.
 * Never exposes raw error details to the user.
 */
export function getFriendlyAIErrorMessage(error?: unknown): string {
  if (error) {
    console.warn(`[${AI_VALIDATION_TAG}] AI service error:`, error)
  }
  return 'AI assistance is temporarily unavailable. You can continue editing manually.'
}
