const normalizeUniqueList = (items: string[]): string[] => {
  const seen = new Set<string>()

  return items.filter((item) => {
    const normalized = item.trim()
    if (!normalized) return false

    const key = normalized.toLowerCase()
    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

export const parseSuggestedList = (value: string): string[] =>
  normalizeUniqueList(
    value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  )

export const stringifySuggestionList = (value: string[]): string => value.join(', ')

export const normalizeSuggestionListValue = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return normalizeUniqueList(value.filter((item): item is string => typeof item === 'string'))
  }

  if (typeof value === 'string') {
    return parseSuggestedList(value)
  }

  return []
}
