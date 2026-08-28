import { test, expect } from '@playwright/test'

test.describe('Saved Recipes & Bookmarks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/saved')
    await page.waitForLoadState('networkidle')
  })

  test('should render Saved Recipes page title and layout', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Saved Recipes', exact: true })).toBeVisible()
    await expect(page.getByText('Your bookmarked recipe collection')).toBeVisible()
  })

  test('should render My Cookbook navigation link in sidebar', async ({ page }) => {
    await expect(page.getByRole('link', { name: /My Cookbook/i })).toBeVisible()
  })
})
