import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  sanitizeAIText,
  validateAISuggestionField,
  validateAISuggestion,
  sanitizeAISuggestion,
  getFriendlyAIErrorMessage,
  AI_VALIDATION_TAG,
  AI_FIELD_LIMITS,
} from './aiValidation'

/**
 * Unit tests for AI suggestion validation and sanitization utilities.
 *
 * BDD Scenarios covered:
 *   Scenario 1: Valid AI suggestion passes validation
 *   Scenario 2: AI response exceeding field length limits is caught
 *   Scenario 3: HTML/script content is sanitized before application
 *   Scenario 4: AI failures return user-friendly messages (form unblocked)
 *   Scenario 5: Structural constraints enforced (servings, tags)
 *   Scenario 6: Validation failures tagged with AI_VALIDATION_TAG for observability
 */

const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

afterEach(() => {
  warnSpy.mockClear()
})

// ---------------------------------------------------------------------------
// sanitizeAIText
// ---------------------------------------------------------------------------

describe('sanitizeAIText', () => {
  it('returns plain text unchanged', () => {
    expect(sanitizeAIText('Chicken soup with vegetables')).toBe('Chicken soup with vegetables')
  })

  it('strips HTML tags', () => {
    expect(sanitizeAIText('<b>Bold Recipe</b>')).toBe('Bold Recipe')
  })

  it('strips script tags — Scenario 3', () => {
    expect(sanitizeAIText("Good<script>alert('xss')</script>description")).toBe('Gooddescription')
  })

  it('strips nested HTML', () => {
    expect(sanitizeAIText('<p class="x">text</p>')).toBe('text')
  })

  it('strips control characters', () => {
    expect(sanitizeAIText('Recipe\u0000Name\u0007')).toBe('RecipeName')
  })

  it('returns empty string for null', () => {
    expect(sanitizeAIText(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(sanitizeAIText(undefined)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// validateAISuggestionField — recipeName
// ---------------------------------------------------------------------------

describe('validateAISuggestionField – recipeName', () => {
  it('passes a valid recipe name — Scenario 1', () => {
    const result = validateAISuggestionField('recipeName', 'Classic Pasta')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects an empty string', () => {
    const result = validateAISuggestionField('recipeName', '')
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toMatch(/recipeName is required/)
  })

  it('rejects a whitespace-only string', () => {
    const result = validateAISuggestionField('recipeName', '   ')
    expect(result.isValid).toBe(false)
  })

  it('rejects a name exceeding max length — Scenario 2', () => {
    const longName = 'A'.repeat(AI_FIELD_LIMITS.recipeName.maxLength + 1)
    const result = validateAISuggestionField('recipeName', longName)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toMatch(/exceeds maximum length/)
  })

  it('accepts a name exactly at max length', () => {
    const name = 'A'.repeat(AI_FIELD_LIMITS.recipeName.maxLength)
    const result = validateAISuggestionField('recipeName', name)
    expect(result.isValid).toBe(true)
  })

  it('logs with AI_VALIDATION_TAG on failure — Scenario 6', () => {
    validateAISuggestionField('recipeName', '')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(AI_VALIDATION_TAG),
      expect.anything()
    )
  })
})

// ---------------------------------------------------------------------------
// validateAISuggestionField — description
// ---------------------------------------------------------------------------

describe('validateAISuggestionField – description', () => {
  it('accepts a valid description', () => {
    const result = validateAISuggestionField('description', 'A delicious pasta.')
    expect(result.isValid).toBe(true)
  })

  it('accepts null description (optional field)', () => {
    const result = validateAISuggestionField('description', null)
    expect(result.isValid).toBe(true)
  })

  it('rejects a description exceeding max length — Scenario 2', () => {
    const long = 'X'.repeat(AI_FIELD_LIMITS.description.maxLength + 1)
    const result = validateAISuggestionField('description', long)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toMatch(/description exceeds maximum length/)
  })
})

// ---------------------------------------------------------------------------
// validateAISuggestionField — servings
// ---------------------------------------------------------------------------

describe('validateAISuggestionField – servings', () => {
  it('accepts valid servings — Scenario 1', () => {
    expect(validateAISuggestionField('servings', 4).isValid).toBe(true)
  })

  it('rejects servings of 0 — Scenario 5', () => {
    const result = validateAISuggestionField('servings', 0)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toMatch(/servings must be between/)
  })

  it('rejects negative servings — Scenario 5', () => {
    expect(validateAISuggestionField('servings', -1).isValid).toBe(false)
  })

  it('rejects servings above maximum — Scenario 5', () => {
    const result = validateAISuggestionField('servings', AI_FIELD_LIMITS.servings.max + 1)
    expect(result.isValid).toBe(false)
  })

  it('accepts servings at boundary values', () => {
    expect(validateAISuggestionField('servings', AI_FIELD_LIMITS.servings.min).isValid).toBe(true)
    expect(validateAISuggestionField('servings', AI_FIELD_LIMITS.servings.max).isValid).toBe(true)
  })

  it('accepts null servings (optional field)', () => {
    expect(validateAISuggestionField('servings', null).isValid).toBe(true)
  })

  it('parses numeric strings', () => {
    expect(validateAISuggestionField('servings', '4').isValid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// validateAISuggestionField — tags
// ---------------------------------------------------------------------------

describe('validateAISuggestionField – tags', () => {
  it('accepts a valid tag list — Scenario 1', () => {
    expect(validateAISuggestionField('tags', ['pasta', 'quick']).isValid).toBe(true)
  })

  it('rejects too many tags — Scenario 5', () => {
    const tags = Array.from({ length: AI_FIELD_LIMITS.tags.maxCount + 1 }, (_, i) => `tag${i}`)
    const result = validateAISuggestionField('tags', tags)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toMatch(/tags list exceeds maximum/)
  })

  it('rejects a tag exceeding max length — Scenario 5', () => {
    const longTag = 'T'.repeat(AI_FIELD_LIMITS.tag.maxLength + 1)
    const result = validateAISuggestionField('tags', [longTag])
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toMatch(/exceeds maximum length/)
  })

  it('accepts null tags', () => {
    expect(validateAISuggestionField('tags', null).isValid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// validateAISuggestionField — ingredients
// ---------------------------------------------------------------------------

describe('validateAISuggestionField – ingredients', () => {
  it('accepts a valid ingredients list', () => {
    const result = validateAISuggestionField('ingredients', ['200g pasta', '2 tbsp oil'])
    expect(result.isValid).toBe(true)
  })

  it('rejects an ingredient exceeding max length', () => {
    const long = 'X'.repeat(AI_FIELD_LIMITS.ingredient.maxLength + 1)
    const result = validateAISuggestionField('ingredients', [long])
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toMatch(/ingredient entry exceeds/)
  })

  it('rejects too many ingredients', () => {
    const ings = Array.from({ length: AI_FIELD_LIMITS.ingredients.maxCount + 1 }, (_, i) => `ing${i}`)
    const result = validateAISuggestionField('ingredients', ings)
    expect(result.isValid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateAISuggestionField — instructions
// ---------------------------------------------------------------------------

describe('validateAISuggestionField – instructions', () => {
  it('accepts valid instructions', () => {
    const result = validateAISuggestionField('instructions', ['Boil water', 'Add pasta'])
    expect(result.isValid).toBe(true)
  })

  it('rejects an instruction step exceeding max length', () => {
    const long = 'X'.repeat(AI_FIELD_LIMITS.instruction.maxLength + 1)
    const result = validateAISuggestionField('instructions', [long])
    expect(result.isValid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateAISuggestion — full recipe
// ---------------------------------------------------------------------------

describe('validateAISuggestion', () => {
  it('validates a fully valid recipe — Scenario 1', () => {
    const result = validateAISuggestion({
      recipeName: 'Classic Pasta',
      description: 'Simple and delicious.',
      ingredients: ['200g pasta', '2 tbsp oil'],
      instructions: ['Boil', 'Toss'],
      servings: 4,
      tags: ['pasta'],
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('collects violations from multiple fields', () => {
    const result = validateAISuggestion({
      recipeName: 'A'.repeat(300),
      servings: 200,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })

  it('logs aggregate warning with AI_VALIDATION_TAG on failure — Scenario 6', () => {
    validateAISuggestion({ recipeName: '' })
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(AI_VALIDATION_TAG),
      expect.anything()
    )
  })
})

// ---------------------------------------------------------------------------
// sanitizeAISuggestion — full recipe object
// ---------------------------------------------------------------------------

describe('sanitizeAISuggestion', () => {
  it('strips HTML from all text fields — Scenario 3', () => {
    const raw = {
      recipeName: '<b>Pasta</b>',
      description: '<p>Good</p>',
      ingredients: ['<em>200g</em> pasta'],
      instructions: ['<p>Boil water</p>'],
      tags: ['<b>vegan</b>'],
    }
    const sanitized = sanitizeAISuggestion(raw)
    expect(sanitized.recipeName).toBe('Pasta')
    expect(sanitized.description).toBe('Good')
    expect((sanitized.ingredients as string[])[0]).toBe('200g pasta')
    expect((sanitized.instructions as string[])[0]).toBe('Boil water')
    expect((sanitized.tags as string[])[0]).toBe('vegan')
  })

  it('does not mutate the original object', () => {
    const raw = { recipeName: '<b>Pasta</b>' }
    sanitizeAISuggestion(raw)
    expect(raw.recipeName).toBe('<b>Pasta</b>')
  })

  it('handles null/undefined text fields gracefully', () => {
    const raw = { recipeName: undefined, description: null as unknown as undefined }
    const sanitized = sanitizeAISuggestion(raw)
    expect(sanitized.recipeName).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// getFriendlyAIErrorMessage — Scenario 4
// ---------------------------------------------------------------------------

describe('getFriendlyAIErrorMessage', () => {
  it('returns a user-friendly message that does not expose raw errors — Scenario 4', () => {
    const rawError = new Error('Internal server error: token limit exceeded')
    const message = getFriendlyAIErrorMessage(rawError)
    expect(message).not.toContain('token limit')
    expect(message).not.toContain('Internal server error')
    expect(message).toMatch(/continue editing manually/i)
  })

  it('returns a fallback message even with no error', () => {
    const message = getFriendlyAIErrorMessage()
    expect(message).toMatch(/continue editing manually/i)
  })

  it('logs the real error with AI_VALIDATION_TAG for observability — Scenario 6', () => {
    getFriendlyAIErrorMessage(new Error('network timeout'))
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(AI_VALIDATION_TAG),
      expect.anything()
    )
  })
})
