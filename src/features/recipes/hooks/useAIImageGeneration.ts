import { useState, useCallback } from 'react'
import { buildApiUrl } from '../../../utils/apiUtils'
import { postWithAuth } from '../../../utils/authApi'

export type AIImageGenerationStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseAIImageGenerationReturn {
  status: AIImageGenerationStatus
  error: string | null
  generateImage: (recipeName: string, description?: string) => Promise<string | null>
}

/**
 * Manages AI image generation state and API calls.
 *
 * BDD Scenarios covered:
 *   - Returns 'idle' status initially
 *   - Sets 'loading' while generating
 *   - Returns imageUrl and sets 'success' on successful generation
 *   - Sets 'error' status and message on failure
 *   - Resets error on new generation attempt
 */
export function useAIImageGeneration(): UseAIImageGenerationReturn {
  const [status, setStatus] = useState<AIImageGenerationStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const generateImage = useCallback(
    async (recipeName: string, description?: string): Promise<string | null> => {
      setStatus('loading')
      setError(null)
      try {
        const apiBase = import.meta.env.VITE_AI_API_URL || import.meta.env.VITE_API_URL || ''
        const url = buildApiUrl(apiBase, '/api/recipes/image/generate')
        const res = await postWithAuth(url, { recipeName, description })
        const data = res.data as { imageUrl?: string; image?: string }
        const imageUrl = data?.imageUrl || data?.image || null

        if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
          const msg = 'Image generation did not return a usable image URL'
          setError(msg)
          setStatus('error')
          console.warn('[AIImageGeneration] generateImage failed:', msg)
          return null
        }

        setStatus('success')
        return imageUrl
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Image generation unavailable'
        setError(msg)
        setStatus('error')
        console.warn('[AIImageGeneration] generateImage failed:', msg)
        return null
      }
    },
    []
  )

  return { status, error, generateImage }
}
