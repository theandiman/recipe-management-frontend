import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SimpleCreateRecipe } from './SimpleCreateRecipe'
import * as recipeStorageApi from '../../services/recipeStorageApi'
import { useAuth } from '../auth/AuthContext'
import type { Recipe } from '../../types/nutrition'

vi.mock('../../services/recipeStorageApi', () => ({
  saveRecipe: vi.fn(() =>
    Promise.resolve({
      id: 'new-recipe-id',
      recipeName: 'Test Recipe',
      userId: 'test-user',
      ingredients: [],
      instructions: [],
      servings: 1,
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  ),
  updateRecipe: vi.fn(() => Promise.resolve(undefined)),
  getRecipe: vi.fn(),
}))

vi.mock('../../utils/authApi', () => ({
  postWithAuth: vi.fn(),
}))

vi.mock('../../utils/apiUtils', () => ({
  buildApiUrl: vi.fn((_base: string, endpoint: string) => endpoint),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

type MockAuthState = ReturnType<typeof useAuth>
type EditableMockRecipe = Omit<Recipe, 'prepTime' | 'cookTime'> & {
  prepTime: number
  cookTime: number
}

const mockRecipe = {
  id: 'test-recipe-123',
  recipeName: 'Test Recipe',
  description: 'A quick edit recipe',
  userId: 'test-user',
  ingredients: ['1 cup flour', '2 eggs'],
  instructions: ['Mix ingredients', 'Bake'],
  servings: 4,
  prepTime: 10,
  cookTime: 20,
  imageUrl: 'https://example.com/image.jpg',
  tags: ['breakfast', 'easy'],
  dietaryRestrictions: ['vegetarian'],
  source: 'ai-generated' as const,
  nutritionalInfo: { calories: 200 },
  tips: ['Use room temperature eggs'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as EditableMockRecipe

const renderWithRouter = (
  component: React.ReactElement,
  initialEntry = '/dashboard/create/simple',
  routePath = '/dashboard/create/simple'
) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={routePath} element={component} />
      </Routes>
    </MemoryRouter>
  )

const setDefaultAuthMock = (overrides: Partial<MockAuthState> = {}) => {
  vi.mocked(useAuth).mockReturnValue({
    user: {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: null,
      photoURL: null,
    },
    isLoading: false,
    ...overrides,
  } as MockAuthState)
}

describe('SimpleCreateRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })
    setDefaultAuthMock()
    vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue(mockRecipe as unknown as Recipe)
  })

  // ─── Layout ──────────────────────────────────────────────────────────────────

  it('renders the page heading', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    expect(screen.getByRole('heading', { name: /Create Recipe/i })).toBeInTheDocument()
  })

  it('renders the mode toggle with Guided and Quick entry options', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    const nav = screen.getByRole('navigation', { name: /Recipe creation mode/i })
    expect(nav).toBeInTheDocument()
    expect(screen.getByText(/Guided/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Quick entry/i })).toBeInTheDocument()
  })

  it('marks Quick entry as the current page in the mode toggle', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    const quickLink = screen.getByRole('link', { name: /Quick entry/i })
    expect(quickLink).toHaveAttribute('aria-current', 'page')
  })

  it('renders the recipe name input', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    expect(
      screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i)
    ).toBeInTheDocument()
  })

  it('renders the description textarea', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    expect(screen.getByPlaceholderText(/Brief description/i)).toBeInTheDocument()
  })

  it('renders the Instructions section header', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    expect(screen.getByText(/Instructions/i)).toBeInTheDocument()
  })

  it('renders the Save Recipe button', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    expect(screen.getByRole('button', { name: /Save Recipe/i })).toBeInTheDocument()
  })

  it('renders the Cancel button', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  // ─── Optional sections ────────────────────────────────────────────────────────

  it('renders all four optional section toggles collapsed by default', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    const timingBtn = screen.getByRole('button', { name: /Timing/i })
    const servingBtn = screen.getByRole('button', { name: /Serving Info/i })
    const tagsBtn = screen.getByRole('button', { name: /Tags & Dietary/i })
    const photoBtn = screen.getByRole('button', { name: /Photo/i })

    expect(timingBtn).toHaveAttribute('aria-expanded', 'false')
    expect(servingBtn).toHaveAttribute('aria-expanded', 'false')
    expect(tagsBtn).toHaveAttribute('aria-expanded', 'false')
    expect(photoBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('expands Timing section when clicked', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    const timingBtn = screen.getByRole('button', { name: /Timing/i })
    fireEvent.click(timingBtn)
    expect(timingBtn).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText(/Prep Time/i)).toBeInTheDocument()
  })

  it('expands Serving Info section when clicked', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.click(screen.getByRole('button', { name: /Serving Info/i }))
    expect(screen.getByLabelText(/Servings/i)).toBeInTheDocument()
  })

  it('expands Tags & Dietary section when clicked', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.click(screen.getByRole('button', { name: /Tags & Dietary/i }))
    expect(screen.getByPlaceholderText(/Add tags/i)).toBeInTheDocument()
  })

  it('expands Photo section when clicked', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.click(screen.getByRole('button', { name: /Photo/i }))
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument()
  })

  it('collapses an open section when clicked again', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    const timingBtn = screen.getByRole('button', { name: /Timing/i })
    fireEvent.click(timingBtn) // open
    expect(timingBtn).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(timingBtn) // close
    expect(timingBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('sections expand and collapse independently', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.click(screen.getByRole('button', { name: /Timing/i }))
    fireEvent.click(screen.getByRole('button', { name: /Photo/i }))

    expect(screen.getByRole('button', { name: /Timing/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('button', { name: /Serving Info/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.getByRole('button', { name: /Photo/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  // ─── Filled indicator ─────────────────────────────────────────────────────────

  it('shows filled badge on Timing section after entering prep time', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    const timingBtn = screen.getByRole('button', { name: /Timing/i })
    fireEvent.click(timingBtn)
    fireEvent.change(screen.getByLabelText(/Prep Time/i), { target: { value: '15' } })
    // Collapse the section to see the badge
    fireEvent.click(timingBtn)
    expect(screen.getByText(/✓ Filled/i)).toBeInTheDocument()
  })

  // ─── Validation ───────────────────────────────────────────────────────────────

  it('shows title required error when saving with empty title', async () => {
    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.click(screen.getByRole('button', { name: /Save Recipe/i }))
    await waitFor(() => {
      expect(screen.getByText(/Recipe name is required/i)).toBeInTheDocument()
    })
  })

  it('shows ingredients required error when saving with no ingredient', async () => {
    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.change(screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i), {
      target: { value: 'My Recipe' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save Recipe/i }))
    await waitFor(() => {
      expect(screen.getByText(/At least one ingredient is required/i)).toBeInTheDocument()
    })
  })

  it('shows instructions required error when saving with no instruction', async () => {
    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.change(screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i), {
      target: { value: 'My Recipe' },
    })
    // Fill in an ingredient item
    fireEvent.change(screen.getByPlaceholderText(/e.g., all-purpose flour/i), {
      target: { value: 'Flour' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save Recipe/i }))
    await waitFor(() => {
      expect(screen.getByText(/At least one instruction is required/i)).toBeInTheDocument()
    })
  })

  // ─── Successful save ──────────────────────────────────────────────────────────

  it('navigates to /dashboard/recipes on successful save', async () => {
    renderWithRouter(<SimpleCreateRecipe />)

    fireEvent.change(screen.getByPlaceholderText(/Grandma's Chocolate Chip Cookies/i), {
      target: { value: 'Quick Pasta' },
    })
    fireEvent.change(screen.getByPlaceholderText(/e.g., all-purpose flour/i), {
      target: { value: 'Pasta' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Describe this step in detail/i), {
      target: { value: 'Boil water and cook pasta.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Save Recipe/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes')
    })
  })

  // ─── Cancel ───────────────────────────────────────────────────────────────────

  it('navigates to /dashboard/recipes when Cancel is clicked', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes')
  })

  describe('edit mode', () => {
    const editRoute = '/dashboard/recipes/edit/:id'
    const editEntry = '/dashboard/recipes/edit/test-recipe-123'

    it('loads existing recipe data into the quick entry form', async () => {
      renderWithRouter(<SimpleCreateRecipe />, editEntry, editRoute)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Edit Recipe/i })).toBeInTheDocument()
      })

      expect(recipeStorageApi.getRecipe).toHaveBeenCalledWith('test-recipe-123')
      expect(screen.getByDisplayValue('Test Recipe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A quick edit recipe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('flour')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Bake')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Update Recipe/i })).toBeInTheDocument()
    })

    it('shows a load error state for edit mode', async () => {
      vi.mocked(recipeStorageApi.getRecipe).mockRejectedValueOnce(new Error('Network error'))

      renderWithRouter(<SimpleCreateRecipe />, editEntry, editRoute)

      await waitFor(() => {
        expect(screen.getByText('Error loading recipe')).toBeInTheDocument()
      })

      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Back to Library/i })).toBeInTheDocument()
    })

    it('redirects to recipe detail when the current user does not own the recipe', async () => {
      setDefaultAuthMock({
        user: {
          uid: 'another-user',
          email: 'test@example.com',
          displayName: null,
          photoURL: null,
        },
      })

      renderWithRouter(<SimpleCreateRecipe />, editEntry, editRoute)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes/test-recipe-123', { replace: true })
      })
    })

    it('updates the recipe and returns to recipe detail on submit', async () => {
      renderWithRouter(<SimpleCreateRecipe />, editEntry, editRoute)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Update Recipe/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Update Recipe/i }))

      await waitFor(() => {
        expect(recipeStorageApi.updateRecipe).toHaveBeenCalledWith(
          'test-recipe-123',
          expect.objectContaining({
            recipeName: 'Test Recipe',
            source: 'ai-generated',
            nutritionalInfo: { calories: 200 },
            tips: ['Use room temperature eggs'],
          })
        )
      })

      expect(recipeStorageApi.saveRecipe).not.toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes/test-recipe-123')
    })

    it('returns to recipe detail when Cancel is clicked in edit mode', async () => {
      renderWithRouter(<SimpleCreateRecipe />, editEntry, editRoute)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/recipes/test-recipe-123')
    })
  })
})

// ─── AI Enhancement (issue #36) ──────────────────────────────────────────────

describe('AI Enhancement', () => {
  beforeEach(() => {
    setDefaultAuthMock()
  })

  it('renders the "Enhance with AI" button', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    expect(screen.getByRole('button', { name: /Enhance recipe with AI/i })).toBeInTheDocument()
  })

  it('does NOT show the AI suggestion panel before the button is clicked', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    expect(screen.queryByRole('region', { name: /AI field suggestions/i })).not.toBeInTheDocument()
  })

  it('shows the AI suggestion panel in loading state when "Enhance with AI" is clicked', async () => {
    const { postWithAuth } = await import('../../utils/authApi')
    // Keep the request pending so we can observe the loading state
    vi.mocked(postWithAuth).mockReturnValue(new Promise(() => {}))

    renderWithRouter(<SimpleCreateRecipe />)

    fireEvent.click(screen.getByRole('button', { name: /Enhance recipe with AI/i }))

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /AI field suggestions/i })).toBeInTheDocument()
    })
  })
})

// ─── AI Undo Affordance (issue #42) ──────────────────────────────────────────

describe('AI Undo Affordance', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    setDefaultAuthMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not show undo button before any AI suggestion is applied', () => {
    renderWithRouter(<SimpleCreateRecipe />)
    expect(screen.queryByRole('button', { name: /Undo:/i })).not.toBeInTheDocument()
  })

  it('shows undo button after accepting an AI suggestion', async () => {
    const { postWithAuth } = await import('../../utils/authApi')
    vi.mocked(postWithAuth).mockResolvedValueOnce({
      data: {
        suggestions: [
          { field: 'description', suggestedValue: 'Delicious pasta', reason: 'Better description' },
        ],
      },
    } as Awaited<ReturnType<typeof postWithAuth>>)

    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.click(screen.getByRole('button', { name: /Enhance recipe with AI/i }))

    // Wait for the suggestion panel, then click its Apply button
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /AI field suggestions/i })).toBeInTheDocument()
    })
    const panel = screen.getByRole('region', { name: /AI field suggestions/i })
    await waitFor(() => {
      expect(within(panel).getByRole('button', { name: /Apply AI suggestion/i })).toBeInTheDocument()
    })
    fireEvent.click(within(panel).getByRole('button', { name: /Apply AI suggestion/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Undo: Description/i })).toBeInTheDocument()
    })
  })

  it('hides undo button after it is clicked (undo reverts field)', async () => {
    const { postWithAuth } = await import('../../utils/authApi')
    vi.mocked(postWithAuth).mockResolvedValueOnce({
      data: {
        suggestions: [
          { field: 'description', suggestedValue: 'Delicious pasta', reason: 'Better description' },
        ],
      },
    } as Awaited<ReturnType<typeof postWithAuth>>)

    renderWithRouter(<SimpleCreateRecipe />)
    fireEvent.click(screen.getByRole('button', { name: /Enhance recipe with AI/i }))

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /AI field suggestions/i })).toBeInTheDocument()
    })
    const panel = screen.getByRole('region', { name: /AI field suggestions/i })
    await waitFor(() => {
      expect(within(panel).getByRole('button', { name: /Apply AI suggestion/i })).toBeInTheDocument()
    })
    fireEvent.click(within(panel).getByRole('button', { name: /Apply AI suggestion/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Undo: Description/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Undo: Description/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Undo: Description/i })).not.toBeInTheDocument()
    })
  })
})
