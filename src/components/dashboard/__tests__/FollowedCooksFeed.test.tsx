import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { FollowedCooksFeed } from '../FollowedCooksFeed'
import * as recipeStorageApi from '../../../services/recipeStorageApi'
import type { Recipe } from '../../../types/nutrition'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../../services/recipeStorageApi', () => ({
  getFeed: vi.fn(),
}))

vi.mock('../../BookmarkButton', () => ({
  default: () => <button data-testid="bookmark-btn">Bookmark</button>,
  BookmarkButton: () => <button data-testid="bookmark-btn">Bookmark</button>,
}))

vi.mock('../../LikeButton', () => ({
  default: () => <button data-testid="like-btn">Like</button>,
  LikeButton: () => <button data-testid="like-btn">Like</button>,
}))

describe('FollowedCooksFeed', () => {
  const mockFeedRecipes: Recipe[] = [
    {
      id: 'feed-1',
      userId: 'cook-42',
      authorName: 'Chef Gordon',
      recipeName: 'Beef Wellington',
      ingredients: ['beef', 'puff pastry'],
      instructions: ['sear', 'wrap', 'bake'],
      servings: 4,
      source: 'user-created',
      createdAt: '2024-03-01T00:00:00Z',
    },
    {
      id: 'feed-2',
      userId: 'cook-99',
      authorName: 'Chef Julia',
      recipeName: 'Coq au Vin',
      ingredients: ['chicken', 'wine'],
      instructions: ['brown', 'simmer'],
      servings: 6,
      source: 'user-created',
      createdAt: '2024-03-02T00:00:00Z',
    },
  ] as unknown as Recipe[]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading skeleton while fetching feed', () => {
    vi.mocked(recipeStorageApi.getFeed).mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <FollowedCooksFeed />
      </BrowserRouter>
    )

    expect(screen.getByTestId('feed-loading-skeleton')).toBeInTheDocument()
    expect(screen.getByText('From cooks you follow')).toBeInTheDocument()
  })

  it('renders followed cook recipes and community link on success', async () => {
    vi.mocked(recipeStorageApi.getFeed).mockResolvedValue(mockFeedRecipes)

    render(
      <BrowserRouter>
        <FollowedCooksFeed />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Beef Wellington')).toBeInTheDocument()
      expect(screen.getByText('Coq au Vin')).toBeInTheDocument()
    })

    const viewAllBtn = screen.getByRole('button', { name: /View all in Community →/i })
    expect(viewAllBtn).toBeInTheDocument()
    fireEvent.click(viewAllBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/community?following=true')
  })

  it('renders authorDisplayName and falls back to Chef <id> instead of Cook', async () => {
    const recipes = [
      {
        id: 'recipe-author-display',
        userId: 'cook-11111',
        authorDisplayName: 'Gordon Ramsay',
        recipeName: 'Scrambled Eggs',
        ingredients: ['eggs'],
        instructions: ['whisk'],
        servings: 2,
        source: 'user-created',
      },
      {
        id: 'recipe-author-fallback',
        userId: 'cook-22222',
        recipeName: 'Toast',
        ingredients: ['bread'],
        instructions: ['toast'],
        servings: 1,
        source: 'user-created',
      },
    ] as unknown as Recipe[]

    vi.mocked(recipeStorageApi.getFeed).mockResolvedValue(recipes)

    render(
      <BrowserRouter>
        <FollowedCooksFeed />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Gordon Ramsay').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Chef cook-/i).length).toBeGreaterThan(0)
      expect(screen.queryByText('Cook')).not.toBeInTheDocument()
    })
  })

  it('renders empty discovery state when user follows no cooks or feed is empty', async () => {
    vi.mocked(recipeStorageApi.getFeed).mockResolvedValue([])

    render(
      <BrowserRouter>
        <FollowedCooksFeed />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('No followed-cook recipes yet')).toBeInTheDocument()
    })

    const discoverBtn = screen.getByRole('button', { name: /Discover Cooks & Recipes/i })
    expect(discoverBtn).toBeInTheDocument()
    fireEvent.click(discoverBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/community')
  })

  it('renders error state and retries on failure', async () => {
    vi.mocked(recipeStorageApi.getFeed)
      .mockRejectedValueOnce(new Error('Network offline'))
      .mockResolvedValueOnce(mockFeedRecipes)

    render(
      <BrowserRouter>
        <FollowedCooksFeed />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Failed to load followed cooks: Network offline/i)).toBeInTheDocument()
    })

    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByText('Beef Wellington')).toBeInTheDocument()
    })
  })
})
