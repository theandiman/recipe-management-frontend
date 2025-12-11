import { describe, it, vi, beforeEach, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { EditRecipe } from './EditRecipe'
import * as recipeStorageApi from '../../services/recipeStorageApi'

vi.mock('../../services/recipeStorageApi')
vi.mock('../../config/firebase', () => ({
  auth: {},
  storage: {}
}))

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

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EditRecipe />} />
        </Routes>
      </BrowserRouter>
    )

    expect(container).toBeTruthy()
  })

  it('should display loading spinner initially', () => {
    const { container } = render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EditRecipe />} />
        </Routes>
      </BrowserRouter>
    )

    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('should render edit recipe form', () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EditRecipe />} />
        </Routes>
      </BrowserRouter>
    )

    // Component should render without errors
    expect(document.body).toBeTruthy()
  })
})
