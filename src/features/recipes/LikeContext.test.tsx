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
})
