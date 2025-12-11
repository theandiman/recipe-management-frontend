import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { postWithAuth, fetchWithAuth } from './authApi'
import { auth } from '../config/firebase'

// Mock Firebase auth
vi.mock('../config/firebase', () => ({
  auth: {
    currentUser: null
  }
}))

// Mock axios
vi.mock('axios')

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn() as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('postWithAuth', () => {
    it('should make POST request with auth token when user is logged in', async () => {
      const mockToken = 'mock-firebase-token'
      const mockGetIdToken = vi.fn().mockResolvedValue(mockToken)
      
      // @ts-expect-error - mocking currentUser
      auth.currentUser = {
        getIdToken: mockGetIdToken
      }

      const mockResponse = { data: { success: true } }
      vi.mocked(axios.post).mockResolvedValue(mockResponse)

      const url = 'https://api.example.com/endpoint'
      const data = { test: 'data' }

      const result = await postWithAuth(url, data)

      expect(mockGetIdToken).toHaveBeenCalled()
      expect(axios.post).toHaveBeenCalledWith(
        url,
        data,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should make POST request without auth token when no user is logged in', async () => {
      // @ts-expect-error - mocking currentUser
      auth.currentUser = null

      const mockResponse = { data: { success: true } }
      vi.mocked(axios.post).mockResolvedValue(mockResponse)

      const url = 'https://api.example.com/endpoint'
      const data = { test: 'data' }

      const result = await postWithAuth(url, data)

      expect(axios.post).toHaveBeenCalledWith(
        url,
        data,
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String)
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should merge custom headers with auth header', async () => {
      const mockToken = 'mock-firebase-token'
      const mockGetIdToken = vi.fn().mockResolvedValue(mockToken)
      
      // @ts-expect-error - mocking currentUser
      auth.currentUser = {
        getIdToken: mockGetIdToken
      }

      const mockResponse = { data: { success: true } }
      vi.mocked(axios.post).mockResolvedValue(mockResponse)

      const url = 'https://api.example.com/endpoint'
      const data = { test: 'data' }
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Custom-Header': 'value'
        }
      }

      await postWithAuth(url, data, config)

      expect(axios.post).toHaveBeenCalledWith(
        url,
        data,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
            'Custom-Header': 'value'
          })
        })
      )
    })

    it('should handle getIdToken errors gracefully', async () => {
      const mockGetIdToken = vi.fn().mockRejectedValue(new Error('Token error'))
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // @ts-expect-error - mocking currentUser
      auth.currentUser = {
        getIdToken: mockGetIdToken
      }

      const mockResponse = { data: { success: true } }
      vi.mocked(axios.post).mockResolvedValue(mockResponse)

      const url = 'https://api.example.com/endpoint'
      const data = { test: 'data' }

      await postWithAuth(url, data)

      expect(consoleWarnSpy).toHaveBeenCalledWith('getIdToken failed', expect.any(Error))
      expect(axios.post).toHaveBeenCalledWith(
        url,
        data,
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String)
          })
        })
      )

      consoleWarnSpy.mockRestore()
    })
  })

  describe('fetchWithAuth', () => {
    it('should make fetch request with auth token when user is logged in', async () => {
      const mockToken = 'mock-firebase-token'
      const mockGetIdToken = vi.fn().mockResolvedValue(mockToken)
      
      // @ts-expect-error - mocking currentUser
      auth.currentUser = {
        getIdToken: mockGetIdToken
      }

      const mockResponse = new Response('{}', { status: 200 })
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse)

      const url = 'https://api.example.com/endpoint'

      const result = await fetchWithAuth(url)

      expect(mockGetIdToken).toHaveBeenCalled()
      expect(globalThis.fetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should make fetch request without auth token when no user is logged in', async () => {
      // @ts-expect-error - mocking currentUser
      auth.currentUser = null

      const mockResponse = new Response('{}', { status: 200 })
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse)

      const url = 'https://api.example.com/endpoint'

      const result = await fetchWithAuth(url)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String)
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should merge custom headers with auth header', async () => {
      const mockToken = 'mock-firebase-token'
      const mockGetIdToken = vi.fn().mockResolvedValue(mockToken)
      
      // @ts-expect-error - mocking currentUser
      auth.currentUser = {
        getIdToken: mockGetIdToken
      }

      const mockResponse = new Response('{}', { status: 200 })
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse)

      const url = 'https://api.example.com/endpoint'
      const opts = {
        headers: {
          'Content-Type': 'application/json',
          'Custom-Header': 'value'
        }
      }

      await fetchWithAuth(url, opts)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
            'Custom-Header': 'value'
          })
        })
      )
    })

    it('should handle getIdToken errors gracefully', async () => {
      const mockGetIdToken = vi.fn().mockRejectedValue(new Error('Token error'))
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // @ts-expect-error - mocking currentUser
      auth.currentUser = {
        getIdToken: mockGetIdToken
      }

      const mockResponse = new Response('{}', { status: 200 })
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse)

      const url = 'https://api.example.com/endpoint'

      await fetchWithAuth(url)

      expect(consoleWarnSpy).toHaveBeenCalledWith('getIdToken failed', expect.any(Error))
      expect(globalThis.fetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String)
          })
        })
      )

      consoleWarnSpy.mockRestore()
    })

    it('should merge custom RequestInit options', async () => {
      const mockToken = 'mock-firebase-token'
      const mockGetIdToken = vi.fn().mockResolvedValue(mockToken)
      
      // @ts-expect-error - mocking currentUser
      auth.currentUser = {
        getIdToken: mockGetIdToken
      }

      const mockResponse = new Response('{}', { status: 200 })
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse)

      const url = 'https://api.example.com/endpoint'
      const opts: RequestInit = {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: {
          'Content-Type': 'application/json'
        }
      }

      await fetchWithAuth(url, opts)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: 'data' }),
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          })
        })
      )
    })
  })
})
