import { test, expect } from '@playwright/test'

test.describe('Create Recipe Multi-Step Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/create')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display step 1 by default', async ({ page }) => {
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible()
    await expect(page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i)).toBeVisible()
  })

  test('should complete full wizard flow', async ({ page }) => {
    // Step 1: Basic Info
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('Chocolate Cake')
    await page.getByPlaceholder(/Brief description/i).fill('A delicious chocolate cake')
    await page.getByRole('button', { name: 'Next →' }).click()
    
    // Step 2: Ingredients
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible()
    await page.getByRole('button', { name: 'Next →' }).click()
    
    // Step 3: Instructions
    await expect(page.getByText(/Step 3 of 5/i)).toBeVisible()
    await page.getByPlaceholder(/Describe this step in detail/i).first().fill('Mix dry ingredients')
    await page.getByRole('button', { name: 'Next →' }).click()
    
    // Step 4: Additional Info
    await expect(page.getByText(/Step 4 of 5/i)).toBeVisible()
    await page.getByPlaceholder('15').fill('20')
    await page.getByPlaceholder('30').fill('45')
    await page.getByPlaceholder('4').fill('8')
    await page.getByRole('button', { name: 'Next →' }).click()
    
    // Step 5: Review
    await expect(page.getByText(/Step 5 of 5/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Chocolate Cake' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Save Recipe/i })).toBeVisible()
  })

  test('should navigate using progress indicator', async ({ page }) => {
    await page.getByRole('button', { name: 'Instructions' }).click()
    await expect(page.getByText(/Step 3 of 5/i)).toBeVisible()
    
    await page.getByRole('button', { name: 'Basic Info' }).click()
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible()
  })

  test('should disable back button on step 1', async ({ page }) => {
    const backButton = page.getByRole('button', { name: 'Back' }).first()
    await expect(backButton).toBeDisabled()
  })

  test('should enable back button after moving to step 2', async ({ page }) => {
    await page.getByRole('button', { name: 'Next →' }).click()
    const backButton = page.getByRole('button', { name: 'Back' }).first()
    await expect(backButton).toBeEnabled()
  })

  test('should preserve data when navigating between steps', async ({ page }) => {
    const title = 'Preserved Recipe Title'
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill(title)
    await page.getByRole('button', { name: 'Next →' }).click()
    await page.getByRole('button', { name: 'Back' }).first().click()
    await expect(page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i)).toHaveValue(title)
  })

  test('should add instructions', async ({ page }) => {
    await page.getByRole('button', { name: 'Instructions' }).click()
    await expect(page.getByText(/Step 3 of 5/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible()
    const initialInputs = await page.getByPlaceholder(/Describe this step in detail/i).count()
    expect(initialInputs).toBe(1)
    await page.getByRole('button', { name: /Add Step/i }).click()
    const afterAdd = await page.getByPlaceholder(/Describe this step in detail/i).count()
    expect(afterAdd).toBe(2)
  })

  test('should add tags', async ({ page }) => {
    await page.getByRole('button', { name: 'Additional Info' }).click()
    await page.getByPlaceholder(/Add tags/i).fill('quick')
    await page.keyboard.press('Enter')
    await expect(page.locator('text=quick').first()).toBeVisible()
  })

  test('should show correct buttons on each step', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Next →' })).toBeVisible()
    await page.getByRole('button', { name: 'Review' }).click()
    await expect(page.getByRole('button', { name: 'Next →' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Save Recipe/i })).toBeVisible()
  })

  test('should show completed steps with checkmark', async ({ page }) => {
    await page.getByRole('button', { name: 'Next →' }).click()
    const step1Button = page.getByRole('button', { name: /Basic Info/i })
    await expect(step1Button.locator('text=✓')).toBeVisible()
  })

  test('should show Cancel button on all steps', async ({ page }) => {
    for (let step = 1; step <= 5; step++) {
      await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible()
      if (step < 5) {
        await page.getByRole('button', { name: 'Next →' }).click()
      }
    }
  })

  test('should navigate back to dashboard when Cancel is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /Cancel/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should display all step buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Basic Info/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ingredients/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Instructions/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Additional Info/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Review/i })).toBeVisible()
  })
})
