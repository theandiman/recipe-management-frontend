import { fetchWithAuth } from './authApi'

const trimApiBase = (value: string | undefined): string => value?.trim().replace(/\/+$/, '') ?? ''

export const resolveAiApiBase = (): string => {
  const preferredAiApiUrl = trimApiBase(import.meta.env.VITE_AI_API_URL)
  const legacyAiApiUrl = trimApiBase(import.meta.env.VITE_API_URL)
  const managementApiUrl = trimApiBase(import.meta.env.VITE_MANAGEMENT_API_URL)
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'

  const aiApiBase = preferredAiApiUrl || legacyAiApiUrl

  if (!aiApiBase) {
    if (isTestMode) {
      return ''
    }

    if (import.meta.env.DEV) {
      return 'http://localhost:8081'
    }

    throw new Error(
      'Missing required AI API URL. Set VITE_AI_API_URL or VITE_API_URL before using AI features.',
    )
  }

  if (managementApiUrl && aiApiBase === managementApiUrl) {
    throw new Error(
      'AI API URL must not match VITE_MANAGEMENT_API_URL. Point VITE_AI_API_URL (or VITE_API_URL) at the AI service instead.',
    )
  }

  return aiApiBase
}

export interface AiSearchIntentResult {
  queryKeywords: string
  dietaryTags: string[]
  maxPrepTime?: number | null
  maxCalories?: number | null
  explanation?: string
}

export const parseAiSearchIntent = async (prompt: string): Promise<AiSearchIntentResult> => {
  if (!prompt || !prompt.trim()) {
    return { queryKeywords: '', dietaryTags: [], explanation: 'Empty search prompt' }
  }

  try {
    const baseUrl = resolveAiApiBase()
    const response = await fetchWithAuth(`${baseUrl}/api/recipes/search/parse-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      throw new Error(`AI search intent API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      queryKeywords: data.queryKeywords || prompt,
      dietaryTags: Array.isArray(data.dietaryTags) ? data.dietaryTags : [],
      maxPrepTime: typeof data.maxPrepTime === 'number' ? data.maxPrepTime : null,
      maxCalories: typeof data.maxCalories === 'number' ? data.maxCalories : null,
      explanation: data.explanation || 'Parsed search intent',
    }
  } catch (error) {
    console.warn('Failed to parse AI search intent, falling back to raw prompt:', error)
    return {
      queryKeywords: prompt,
      dietaryTags: [],
      explanation: 'Using standard keyword search.',
    }
  }
}

export interface RecipeSummaryForAi {
  id: string
  recipeName: string
  description?: string
  tags?: string[]
  ingredients?: string[]
  prepTimeMinutes?: number
}

export interface AiSearchQueryResult {
  matches: Array<{
    recipeId: string
    matchScore: number
    matchReason: string
  }>
  suggestedIdea?: {
    title: string
    prompt: string
    reason: string
  } | null
}

export const queryAiSearch = async (
  prompt: string,
  recipes: RecipeSummaryForAi[],
): Promise<AiSearchQueryResult> => {
  if (!prompt || !prompt.trim()) {
    return { matches: [], suggestedIdea: null }
  }

  try {
    const baseUrl = resolveAiApiBase()
    const response = await fetchWithAuth(`${baseUrl}/api/recipes/search/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, recipes }),
    })

    if (!response.ok) {
      throw new Error(`AI direct search query API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      matches: Array.isArray(data.matches) ? data.matches : [],
      suggestedIdea: data.suggestedIdea || null,
    }
  } catch (error) {
    console.warn('Failed to query AI direct search, returning empty matches:', error)
    return { matches: [], suggestedIdea: null }
  }
}
