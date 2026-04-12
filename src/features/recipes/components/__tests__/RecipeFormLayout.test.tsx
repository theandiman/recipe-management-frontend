import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { RecipeFormLayout } from '../RecipeFormLayout'
import type { ComponentProps } from 'react'

vi.mock('../../../../utils/authApi', () => ({
  postWithAuth: vi.fn(),
}))
vi.mock('../../../../utils/apiUtils', () => ({
  buildApiUrl: vi.fn((_base: string, endpoint: string) => endpoint),
}))

import { postWithAuth } from '../../../../utils/authApi'
const mockPostWithAuth = vi.mocked(postWithAuth)

const mockIngredients = [{ quantity: '', unit: '', item: '' }]
const mockSteps = [
  { number: 1, title: 'Basic Info', icon: '📝' },
  { number: 2, title: 'Ingredients', icon: '🥕' },
  { number: 3, title: 'Instructions', icon: '📋' },
  { number: 4, title: 'Additional Info', icon: '⏱️' },
  { number: 5, title: 'Review', icon: '✅' },
]

function makeProps(overrides: Partial<ComponentProps<typeof RecipeFormLayout>> = {}): ComponentProps<typeof RecipeFormLayout> {
  return {
    mode: 'create',
    currentStep: 1,
    totalSteps: 5,
    steps: mockSteps,
    goToStep: vi.fn(),
    goToNextStep: vi.fn(),
    goToPreviousStep: vi.fn(),
    canGoNext: true,
    canGoPrevious: false,
    stepsWithErrors: new Set(),
    title: '',
    setTitle: vi.fn(),
    description: '',
    setDescription: vi.fn(),
    prepTime: '',
    setPrepTime: vi.fn(),
    cookTime: '',
    setCookTime: vi.fn(),
    servings: '',
    setServings: vi.fn(),
    imagePreview: null,
    handleImageUpload: vi.fn(),
    removeImage: vi.fn(),
    ingredients: mockIngredients,
    addIngredient: vi.fn(),
    updateIngredient: vi.fn(),
    removeIngredient: vi.fn(),
    instructions: [''],
    addInstruction: vi.fn(),
    updateInstruction: vi.fn(),
    removeInstruction: vi.fn(),
    tags: [],
    tagInput: '',
    setTagInput: vi.fn(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
    dietaryRestrictions: [],
    dietaryInput: '',
    setDietaryInput: vi.fn(),
    addDietaryRestriction: vi.fn(),
    removeDietaryRestriction: vi.fn(),
    fieldErrors: {},
    clearFieldError: vi.fn(),
    setFieldErrors: vi.fn(),
    setStepsWithErrors: vi.fn(),
    saveLoading: false,
    saveError: null,
    setSaveError: vi.fn(),
    handleSubmit: vi.fn(),
    handleCancel: vi.fn(),
    ...overrides,
  }
}

const renderWithRouter = (props: ComponentProps<typeof RecipeFormLayout>) =>
  render(<BrowserRouter><RecipeFormLayout {...props} /></BrowserRouter>)

describe('RecipeFormLayout — on-demand AI enhancement (issue #35)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('does NOT auto-fetch AI suggestions when title is typed', async () => {
    // Even with a title longer than 2 chars, no fetch should happen without a button click
    renderWithRouter(makeProps({ title: 'My Recipe' }))
    // Give React time to run any effects
    await new Promise(r => setTimeout(r, 50))
    expect(mockPostWithAuth).not.toHaveBeenCalled()
  })

  it('renders the "Enhance with AI" button on non-preview steps', () => {
    renderWithRouter(makeProps())
    expect(screen.getByRole('button', { name: /Enhance recipe with AI/i })).toBeInTheDocument()
  })

  it('does NOT render the "Enhance with AI" button on step 5 (preview)', () => {
    renderWithRouter(makeProps({ currentStep: 5 }))
    expect(screen.queryByRole('button', { name: /Enhance recipe with AI/i })).not.toBeInTheDocument()
  })

  it('calls AI suggestions API when "Enhance with AI" is clicked', async () => {
    mockPostWithAuth.mockResolvedValueOnce({ data: { suggestions: [] } } as any)

    renderWithRouter(makeProps({ title: 'Pasta' }))
    fireEvent.click(screen.getByRole('button', { name: /Enhance recipe with AI/i }))

    await waitFor(() => expect(mockPostWithAuth).toHaveBeenCalledOnce())
    expect(mockPostWithAuth).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ recipeName: 'Pasta' })
    )
  })

  it('shows the suggestion panel only after the button is clicked', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        suggestions: [
          { field: 'description', suggestedValue: 'A tasty dish', reason: 'Empty' },
        ],
      },
    } as any)

    renderWithRouter(makeProps({ title: 'Pasta' }))
    // Panel is hidden before click
    expect(screen.queryByRole('region', { name: /AI field suggestions/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Enhance recipe with AI/i }))

    await waitFor(() =>
      expect(screen.getByRole('region', { name: /AI field suggestions/i })).toBeInTheDocument()
    )
  })

  it('disables the button while a fetch is in progress', async () => {
    let resolvePost: (v: any) => void
    mockPostWithAuth.mockImplementationOnce(() => new Promise(r => { resolvePost = r }))

    renderWithRouter(makeProps())
    const btn = screen.getByRole('button', { name: /Enhance recipe with AI/i })
    fireEvent.click(btn)

    await waitFor(() => expect(btn).toBeDisabled())

    resolvePost!({ data: { suggestions: [] } })
    await waitFor(() => expect(btn).not.toBeDisabled())
  })
})

describe('RecipeFormLayout — AI undo affordance (issue #42)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not show undo button before any suggestion is applied', () => {
    renderWithRouter(makeProps())
    expect(screen.queryByRole('button', { name: /Undo:/i })).not.toBeInTheDocument()
  })

  it('shows undo button in header after a suggestion is applied', async () => {
    mockPostWithAuth.mockResolvedValueOnce({
      data: {
        suggestions: [
          { field: 'description', suggestedValue: 'A tasty pasta dish', reason: 'Improve description' },
        ],
      },
    } as any)

    renderWithRouter(makeProps({ title: 'Pasta' }))
    fireEvent.click(screen.getByRole('button', { name: /Enhance recipe with AI/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Apply AI suggestion for Description/i })).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: /Apply AI suggestion for Description/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Undo: Description/i })).toBeInTheDocument()
    )
  })
})
