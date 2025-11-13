import { test, expect } from '@playwright/test'

test.describe('Test Mode Verification', () => {
  test('should bypass authentication and access dashboard', async ({ page }) => {
    // Go directly to dashboard (protected route)
    await page.goto('/dashboard')
    
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/)
    
    // Should see dashboard content - use a more specific selector
    await expect(page.getByRole('link', { name: 'Browse Recipes' })).toBeVisible({ timeout: 10000 })
  })

  test('should access create recipe page without authentication', async ({ page }) => {
    // Go directly to create recipe page (protected route)
    await page.goto('/dashboard/create')
    
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/)
    
    // Should see the create recipe form
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 })
  })
})
