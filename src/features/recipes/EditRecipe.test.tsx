import { describe, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { EditRecipe } from './EditRecipe'
import * as recipeStorageApi from '../../services/recipeStorageApi'

vi.mock('../../services/recipeStorageApi')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'test-id' }),
    useNavigate: () => vi.fn()
  }
})

describe('EditRecipe', () => {
  beforeEach(() => {
    vi.mocked(recipeStorageApi.getRecipe).mockResolvedValue({
      id: 'test-id',
      recipeName: 'Test Recipe',
      description: 'Test Description',
      ingredients: [],
      instructions: [],
      servings: 4,
      source: 'user'
    })
  })

  it('should render loading state', () => {
    render(
      <BrowserRouter>
        <EditRecipe />
      </BrowserRouter>
    )

    screen.getByText(/loading/i)
  })

  it('should load recipe data', async () => {
    render(
      <BrowserRouter>
        <EditRecipe />
      </BrowserRouter>
    )

    await screen.findByText(/edit recipe/i)
  })

  it('should render step indicator', async () => {
    render(
      <BrowserRouter>
        <EditRecipe />
      </BrowserRouter>
    )

    await screen.findByText(/basic info/i)
  })
})
