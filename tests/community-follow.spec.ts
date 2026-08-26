import { test, expect } from '@playwright/test'

test.describe('Community & Follow Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept community recipes endpoint
    await page.route('**/api/recipes/public*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'community-recipe-1',
            userId: 'user-maria-1',
            recipeName: 'Sourdough Artisan Bread',
            description: 'Freshly baked sourdough loaf',
            ingredients: ['Flour', 'Water', 'Salt', 'Starter'],
            instructions: ['Mix ingredients', 'Ferment', 'Bake'],
            prepTime: 20,
            cookTime: 45,
            servings: 4,
            isPublic: true,
            authorDisplayName: 'Maria Rossi',
          },
        ]),
      })
    })

    await page.route('**/api/users/user-secret-2/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uid: 'user-secret-2',
          displayName: 'Secret Baker',
          bio: '',
          avatarUrl: '',
          visibility: 'PRIVATE',
          followerCount: 5,
          followingCount: 2,
          publicRecipeCount: 0,
          publicRecipes: [],
          isFollowedByCurrentUser: false,
        }),
      })
    })

    await page.goto('/dashboard/community')
    await page.waitForLoadState('networkidle')
  })

  test('should render Community page title and public recipes', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Community Recipes/i })).toBeVisible()
    await expect(page.getByText('Sourdough Artisan Bread')).toBeVisible()
  })

  test('should display private account banner when visiting non-followed private user profile', async ({ page }) => {
    await page.goto('/user/user-secret-2')
    await expect(page.getByRole('heading', { name: 'Secret Baker' })).toBeVisible()
    await expect(page.getByText('This Account is Private')).toBeVisible()
    await expect(page.getByText('Follow this user to see their public recipes')).toBeVisible()
  })
})
