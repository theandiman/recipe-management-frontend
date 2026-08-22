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
