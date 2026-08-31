/**
 * Safely constructs an API URL by joining base URL and path.
 */
export function buildApiUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) return path
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${cleanBase}${cleanPath}`
}

/**
 * Safely extracts error messages from API responses or Error instances.
 */
export function extractApiErrorMessage(err: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (!err) return defaultMessage

  if (typeof err === 'string') return err

  const apiError = err as {
    response?: {
      data?: {
        message?: string
        error?: string
      }
    }
    message?: string
  }

  if (apiError.response?.data?.message) {
    return apiError.response.data.message
  }

  if (apiError.response?.data?.error) {
    return apiError.response.data.error
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  if (apiError.message) {
    return apiError.message
  }

  return defaultMessage
}
