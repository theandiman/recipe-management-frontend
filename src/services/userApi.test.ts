import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { getMyProfile, updateMyProfile, updateUserProfile } from './userApi'

vi.mock('axios')
vi.mock('../config/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('mock-token'),
    },
  },
}))

describe('userApi self-service profile functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getMyProfile fetches caller profile from /api/users/me/profile', async () => {
    const mockProfile = {
      uid: 'user-me',
      displayName: 'Me Chef',
      bio: 'Cooking all day',
      visibility: 'PUBLIC',
      publicRecipeCount: 3,
      publicRecipes: [],
    }
    vi.spyOn(axios, 'get').mockResolvedValue({ data: mockProfile })

    const result = await getMyProfile()
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/me/profile'),
      expect.any(Object)
    )
    expect(result.uid).toBe('user-me')
    expect(result.displayName).toBe('Me Chef')
  })

  it('updateMyProfile sends PUT request to /api/users/me/profile', async () => {
    const updatePayload = {
      displayName: 'Updated Name',
      bio: 'New Bio',
      visibility: 'PRIVATE',
    }
    const mockResponse = {
      uid: 'user-me',
      displayName: 'Updated Name',
      bio: 'New Bio',
      visibility: 'PRIVATE',
      publicRecipeCount: 3,
      publicRecipes: [],
    }
    vi.spyOn(axios, 'put').mockResolvedValue({ data: mockResponse })

    const result = await updateMyProfile(updatePayload)
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/me/profile'),
      updatePayload,
      expect.any(Object)
    )
    expect(result.displayName).toBe('Updated Name')
    expect(result.visibility).toBe('PRIVATE')
  })

  it('updateUserProfile sends PUT request to /api/users/{uid}/profile', async () => {
    const updatePayload = {
      displayName: 'Custom Name',
    }
    const mockResponse = {
      uid: 'user-123',
      displayName: 'Custom Name',
      publicRecipeCount: 0,
      publicRecipes: [],
    }
    vi.spyOn(axios, 'put').mockResolvedValue({ data: mockResponse })

    const result = await updateUserProfile('user-123', updatePayload)
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/user-123/profile'),
      updatePayload,
      expect.any(Object)
    )
    expect(result.displayName).toBe('Custom Name')
  })
})
