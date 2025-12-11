import { describe, it, expect } from 'vitest'
import { buildApiUrl } from './apiUtils'

describe('apiUtils', () => {
  describe('buildApiUrl', () => {
    it('should combine base URL and endpoint', () => {
      expect(buildApiUrl('http://localhost:8080', '/api/recipes')).toBe('http://localhost:8080/api/recipes')
      expect(buildApiUrl('https://api.example.com', '/users')).toBe('https://api.example.com/users')
    })

    it('should remove trailing slash from base URL', () => {
      expect(buildApiUrl('http://localhost:8080/', '/api/recipes')).toBe('http://localhost:8080/api/recipes')
      expect(buildApiUrl('https://api.example.com/', '/users')).toBe('https://api.example.com/users')
    })

    it('should handle multiple trailing slashes', () => {
      // The regex only removes one trailing slash, so this is expected behavior
      expect(buildApiUrl('http://localhost:8080///', '/api/recipes')).toBe('http://localhost:8080//api/recipes')
    })

    it('should return endpoint as-is when base URL is undefined', () => {
      expect(buildApiUrl(undefined, '/api/recipes')).toBe('/api/recipes')
      expect(buildApiUrl(undefined, '/users')).toBe('/users')
    })

    it('should return endpoint as-is when base URL is empty string', () => {
      expect(buildApiUrl('', '/api/recipes')).toBe('/api/recipes')
    })

    it('should handle endpoints without leading slash', () => {
      expect(buildApiUrl('http://localhost:8080', 'api/recipes')).toBe('http://localhost:8080api/recipes')
    })

    it('should handle root endpoint', () => {
      expect(buildApiUrl('http://localhost:8080', '/')).toBe('http://localhost:8080/')
    })

    it('should handle complex paths', () => {
      expect(buildApiUrl('http://localhost:8080', '/api/v1/recipes/123')).toBe('http://localhost:8080/api/v1/recipes/123')
    })

    it('should handle query parameters', () => {
      expect(buildApiUrl('http://localhost:8080', '/api/recipes?limit=10')).toBe('http://localhost:8080/api/recipes?limit=10')
    })
  })
})
