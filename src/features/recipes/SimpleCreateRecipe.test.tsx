import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SimpleCreateRecipe } from './SimpleCreateRecipe'

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
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (component: React.ReactElement) =>
  render(<BrowserRouter>{component}</BrowserRouter>)

describe('SimpleCreateRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
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
})
