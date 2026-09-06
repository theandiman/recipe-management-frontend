import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { LikeProvider, useLikeContext } from './LikeContext'

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock API functions
const mockLikeRecipe = vi.fn()
const mockUnlikeRecipe = vi.fn()
vi.mock('../../services/recipeStorageApi', () => ({
  likeRecipe: (id: string) => mockLikeRecipe(id),
  unlikeRecipe: (id: string) => mockUnlikeRecipe(id)
}))

/** Simple consumer component that exposes the context API via data-testid elements */
const TestConsumer = ({ recipeId }: { recipeId: string }) => {
  const { getLikeState, initRecipe, toggleLike } = useLikeContext()
  const state = getLikeState(recipeId)

  return (
    <div>
      <div data-testid="is-liked">{state?.isLiked ? 'true' : 'false'}</div>
      <div data-testid="like-count">{state?.likeCount ?? 'undefined'}</div>
      <button onClick={() => initRecipe(recipeId, false, 5)}>Init</button>
      <button onClick={() => initRecipe(recipeId, true, 10)}>Init Liked</button>
      <button onClick={() => initRecipe(recipeId, false, 8)}>Init Higher Count</button>
      <button onClick={() => toggleLike(recipeId)}>Toggle</button>
    </div>
  )
}

const renderProvider = (recipeId = 'r1') =>
  render(
    <LikeProvider>
      <TestConsumer recipeId={recipeId} />
    </LikeProvider>
  )

describe('LikeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    mockLikeRecipe.mockResolvedValue(undefined)
    mockUnlikeRecipe.mockResolvedValue(undefined)
  })

  it('throws when useLikeContext is used outside LikeProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer recipeId="r1" />)).toThrow(
      'useLikeContext must be used within a LikeProvider'
    )
    consoleError.mockRestore()
  })

  it('starts with undefined state for unknown recipe', () => {
    renderProvider()
    expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
    expect(screen.getByTestId('like-count')).toHaveTextContent('undefined')
  })

  it('initRecipe seeds the context state', async () => {
    renderProvider()

    await act(async () => {
      screen.getByText('Init').click()
    })

    expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
    expect(screen.getByTestId('like-count')).toHaveTextContent('5')
  })

  it('initRecipe sets isLiked true when seeded as liked', async () => {
    renderProvider()

    await act(async () => {
      screen.getByText('Init Liked').click()
    })

    expect(screen.getByTestId('is-liked')).toHaveTextContent('true')
    expect(screen.getByTestId('like-count')).toHaveTextContent('10')
  })

  describe('toggleLike', () => {
    it('optimistically likes recipe and calls likeRecipe', async () => {
      renderProvider()

      await act(async () => {
        screen.getByText('Init').click()
      })

      await act(async () => {
        screen.getByText('Toggle').click()
      })

      expect(screen.getByTestId('is-liked')).toHaveTextContent('true')
      expect(screen.getByTestId('like-count')).toHaveTextContent('6')
      expect(mockLikeRecipe).toHaveBeenCalledWith('r1')
    })

    it('optimistically unlikes recipe and calls unlikeRecipe', async () => {
      renderProvider()

      await act(async () => {
        screen.getByText('Init Liked').click()
      })

      await act(async () => {
        screen.getByText('Toggle').click()
      })

      expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
      expect(screen.getByTestId('like-count')).toHaveTextContent('9')
      expect(mockUnlikeRecipe).toHaveBeenCalledWith('r1')
    })

    it('rolls back optimistic like when likeRecipe fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockLikeRecipe.mockRejectedValue(new Error('Network error'))
      renderProvider()

      await act(async () => {
        screen.getByText('Init').click()
      })

      await act(async () => {
        screen.getByText('Toggle').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
        expect(screen.getByTestId('like-count')).toHaveTextContent('5')
      })
      consoleError.mockRestore()
    })

    it('rolls back optimistic unlike when unlikeRecipe fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockUnlikeRecipe.mockRejectedValue(new Error('Network error'))
      renderProvider()

      await act(async () => {
        screen.getByText('Init Liked').click()
      })

      await act(async () => {
        screen.getByText('Toggle').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('is-liked')).toHaveTextContent('true')
        expect(screen.getByTestId('like-count')).toHaveTextContent('10')
      })
      consoleError.mockRestore()
    })

    it('does nothing when not authenticated', async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false })
      renderProvider()

      await act(async () => {
        screen.getByText('Init').click()
      })

      await act(async () => {
        screen.getByText('Toggle').click()
      })

      expect(mockLikeRecipe).not.toHaveBeenCalled()
      expect(mockUnlikeRecipe).not.toHaveBeenCalled()
      expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
    })

    it('does nothing when recipe state is uninitialized', async () => {
      renderProvider()

      await act(async () => {
        screen.getByText('Toggle').click()
      })

      expect(mockLikeRecipe).not.toHaveBeenCalled()
    })
  })

  it('resets isLiked to false on logout but preserves likeCount', async () => {
    const { rerender } = renderProvider()

    await act(async () => {
      screen.getByText('Init Liked').click()
    })

    expect(screen.getByTestId('is-liked')).toHaveTextContent('true')
    expect(screen.getByTestId('like-count')).toHaveTextContent('10')

    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    rerender(
      <LikeProvider>
        <TestConsumer recipeId="r1" />
      </LikeProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
      expect(screen.getByTestId('like-count')).toHaveTextContent('10')
    })
  })

  it('does not rollback isLiked when API fails after user has logged out', async () => {
    // Simulate a slow API that rejects after the user logs out mid-flight
    let rejectApi!: (e: Error) => void
    mockLikeRecipe.mockReturnValue(new Promise<void>((_, reject) => { rejectApi = reject }))

    const { rerender } = renderProvider()

    await act(async () => {
      screen.getByText('Init').click()  // seed: isLiked=false, count=5
    })

    // Start the toggle (optimistic update fires immediately)
    act(() => { screen.getByText('Toggle').click() })

    // Optimistic state: liked=true, count=6
    expect(screen.getByTestId('is-liked')).toHaveTextContent('true')

    // User logs out while request is still in-flight
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    rerender(
      <LikeProvider>
        <TestConsumer recipeId="r1" />
      </LikeProvider>
    )

    await waitFor(() => {
      // Logout reset should have set isLiked to false
      expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
    })

    // Now the in-flight request rejects — rollback must NOT fire
    await act(async () => { rejectApi(new Error('Network error')) })

    // isLiked must stay false (not rolled back to isLiked=true).
    // likeCount stays at the optimistic value (6) because rollback was skipped.
    expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
    expect(screen.getByTestId('like-count')).toHaveTextContent('6')
  })

  it('uses initialState fallback in toggleLike when recipe has not been initialized', async () => {
    // Do NOT call initRecipe — recipe state is still undefined in context.
    // toggleLike is invoked with an initialState to simulate a fast click before
    // the useEffect in LikeButton has had a chance to run initRecipe.
    const TestFastClick = ({ recipeId }: { recipeId: string }) => {
      const { toggleLike } = useLikeContext()
      return (
        <button onClick={() => toggleLike(recipeId, { isLiked: false, likeCount: 3 })}>
          Fast Toggle
        </button>
      )
    }
    render(
      <LikeProvider>
        <TestConsumer recipeId="r1" />
        <TestFastClick recipeId="r1" />
      </LikeProvider>
    )

    await act(async () => {
      screen.getByText('Fast Toggle').click()
    })

    // Should have applied an optimistic like even without prior initRecipe
    expect(screen.getByTestId('is-liked')).toHaveTextContent('true')
    expect(screen.getByTestId('like-count')).toHaveTextContent('4')
    expect(mockLikeRecipe).toHaveBeenCalledWith('r1')
  })

  it('does not overwrite active like state when initRecipe is called again with stale props', async () => {
    renderProvider()

    // 1. Initial seed: unliked, count 5
    await act(async () => {
      screen.getByText('Init').click()
    })
    expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
    expect(screen.getByTestId('like-count')).toHaveTextContent('5')

    // 2. User toggles like -> liked, count 6
    await act(async () => {
      screen.getByText('Toggle').click()
    })
    expect(screen.getByTestId('is-liked')).toHaveTextContent('true')
    expect(screen.getByTestId('like-count')).toHaveTextContent('6')

    // 3. Parent re-renders with stale props (Init: unliked, count 5)
    await act(async () => {
      screen.getByText('Init').click()
    })

    // 4. Must NOT revert to unliked or count 5
    expect(screen.getByTestId('is-liked')).toHaveTextContent('true')
    expect(screen.getByTestId('like-count')).toHaveTextContent('6')
  })

  it('clears likeMap when a new user logs in', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    const { rerender } = renderProvider()

    // User logs in
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    rerender(
      <LikeProvider>
        <TestConsumer recipeId="r1" />
      </LikeProvider>
    )

    await act(async () => {
      screen.getByText('Init Liked').click()
    })
    expect(screen.getByTestId('is-liked')).toHaveTextContent('true')

    // User logs out
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    rerender(
      <LikeProvider>
        <TestConsumer recipeId="r1" />
      </LikeProvider>
    )

    // Another user logs in
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
    rerender(
      <LikeProvider>
        <TestConsumer recipeId="r1" />
      </LikeProvider>
    )

    // Context should be reset for new user session
    expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
  })

  it('updates likeCount when initRecipe is called with matching isLiked but updated server count', async () => {
    renderProvider()

    // 1. Initial seed: unliked, count 5
    await act(async () => {
      screen.getByText('Init').click()
    })
    expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
    expect(screen.getByTestId('like-count')).toHaveTextContent('5')

    // 2. Refetch from server with new count 8 (isLiked is still false)
    await act(async () => {
      screen.getByText('Init Higher Count').click()
    })

    // 3. likeCount should update to 8
    expect(screen.getByTestId('is-liked')).toHaveTextContent('false')
    expect(screen.getByTestId('like-count')).toHaveTextContent('8')
  })
})
