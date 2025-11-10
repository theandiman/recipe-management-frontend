/**
 * Build API URL with optional base URL prefix and trailing slash normalization
 * @param apiBase - Optional API base URL (e.g., from VITE_API_URL environment variable)
 * @param endpoint - API endpoint path (should start with /)
 * @returns Full API URL with normalized trailing slashes
 */
export const buildApiUrl = (apiBase: string | undefined, endpoint: string): string => {
  // If apiBase is provided and not empty, remove trailing slash and append endpoint
  // Otherwise, return endpoint as-is (for relative URLs)
  return apiBase ? `${String(apiBase).replace(/\/$/, '')}${endpoint}` : endpoint
}
