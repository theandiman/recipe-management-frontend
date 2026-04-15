import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './DashboardLayout'

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', uid: 'test-user' },
    logout: vi.fn(),
  }),
}))

vi.mock('../Dashboard', () => ({
  Dashboard: () => <div>DashboardStub</div>,
}))

vi.mock('../ThemeToggle', () => ({
  ThemeToggle: () => <div>ThemeToggleStub</div>,
}))

vi.mock('../../features/recipes/RecipeLibrary', () => ({
  RecipeLibrary: () => <div>RecipeLibraryStub</div>,
}))

vi.mock('../../features/recipes/RecipeDetail', () => ({
  RecipeDetail: () => <div>RecipeDetailStub</div>,
}))

vi.mock('../../features/recipes/CreateRecipe', () => ({
  CreateRecipe: () => <div>CreateRecipeStub</div>,
}))

vi.mock('../../features/recipes/SimpleCreateRecipe', () => ({
  SimpleCreateRecipe: () => <div>SimpleCreateRecipeStub</div>,
}))

vi.mock('../../features/recipes/AIGenerator', () => ({
  AIGenerator: () => <div>AIGeneratorStub</div>,
}))

vi.mock('../../features/help/HelpPage', () => ({
  HelpPage: () => <div>HelpPageStub</div>,
}))

vi.mock('../../features/community/CommunityPage', () => ({
  CommunityPage: () => <div>CommunityPageStub</div>,
}))

vi.mock('../../features/recipes/SavedRecipesPage', () => ({
  SavedRecipesPage: () => <div>SavedRecipesPageStub</div>,
}))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard/*" element={<DashboardLayout />} />
      </Routes>
    </MemoryRouter>
  )

describe('DashboardLayout routing', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true, configurable: true })
  })

  it('renders recipe detail for /dashboard/recipes/:id', () => {
    renderAt('/dashboard/recipes/1')

    expect(screen.getByText('RecipeDetailStub')).toBeInTheDocument()
  })

  it('renders quick entry UI for /dashboard/recipes/edit/:id', () => {
    renderAt('/dashboard/recipes/edit/1')

    expect(screen.getByText('SimpleCreateRecipeStub')).toBeInTheDocument()
  })
})
