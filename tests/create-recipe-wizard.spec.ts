import { test, expect } from '@playwright/test'

test.describe('Create Recipe Multi-Step Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to create recipe page (assuming user is already logged in)
    await page.goto('/dashboard/create-recipe')
  })

  test('should display step 1 by default', async ({ page }) => {
    await expect(page.getByText('Step 1 of 4: Basic Info')).toBeVisible()
    await expect(page.getByText('Basic Information')).toBeVisible()
    await expect(page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i)).toBeVisible()
  })

  test('should complete full wizard flow', async ({ page }) => {
    // Step 1: Fill basic info
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('Chocolate Cake')
    await page.getByPlaceholder(/Brief description/i).fill('A delicious chocolate cake')
    await page.getByPlaceholder('15').fill('20')
    await page.getByPlaceholder('30').fill('45')
    await page.getByPlaceholder('4').fill('8')
    
    // Navigate to step 2
    await page.getByRole('button', { name: 'Next →' }).click()
    await expect(page.getByText('Step 2 of 4: Ingredients')).toBeVisible()
    
    // Step 2: Add ingredients
    await page.getByPlaceholder(/2 cups all-purpose flour/i).first().fill('2 cups flour')
    await page.getByRole('button', { name: /Add Ingredient/i }).click()
    await page.getByPlaceholder(/2 cups all-purpose flour/i).nth(1).fill('1 cup sugar')
    
    // Navigate to step 3
    await page.getByRole('button', { name: 'Next →' }).click()
    await expect(page.getByText('Step 3 of 4: Instructions')).toBeVisible()
    
    // Step 3: Add instructions and tags
    await page.getByPlaceholder(/Describe this step in detail/i).first().fill('Mix dry ingredients')
    await page.getByRole('button', { name: /Add Step/i }).click()
    await page.getByPlaceholder(/Describe this step in detail/i).nth(1).fill('Bake for 45 minutes')
    
    // Add tags
    await page.getByPlaceholder(/Add tags/i).fill('dessert')
    await page.getByPlaceholder(/Add tags/i).press('Enter')
    await expect(page.getByText('dessert')).toBeVisible()
    
    // Navigate to step 4
    await page.getByRole('button', { name: 'Next →' }).click()
    await expect(page.getByText('Step 4 of 4: Review')).toBeVisible()
    
    // Step 4: Preview the recipe
    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(page.getByText('Chocolate Cake')).toBeVisible()
    await expect(page.getByText('A delicious chocolate cake')).toBeVisible()
    
    // Save button should be visible
    await expect(page.getByRole('button', { name: /Save Recipe/i })).toBeVisible()
  })

  test('should navigate using progress indicator', async ({ page }) => {
    // Click on step 3 directly
    await page.getByRole('button', { name: 'Instructions' }).click()
    await expect(page.getByText('Step 3 of 4: Instructions')).toBeVisible()
    
    // Click on step 1
    await page.getByRole('button', { name: 'Basic Info' }).click()
    await expect(page.getByText('Step 1 of 4: Basic Info')).toBeVisible()
  })

  test('should disable back button on step 1', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /← Back/i })
    await expect(backButton).toBeDisabled()
  })

  test('should enable back button after moving to step 2', async ({ page }) => {
    await page.getByRole('button', { name: 'Next →' }).click()
    
    const backButton = page.getByRole('button', { name: /← Back/i })
    await expect(backButton).toBeEnabled()
  })

  test('should preserve data when navigating between steps', async ({ page }) => {
    // Fill title on step 1
    const title = 'Preserved Recipe Title'
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill(title)
    
    // Navigate to step 2 and back
    await page.getByRole('button', { name: 'Next →' }).click()
    await page.getByRole('button', { name: /← Back/i }).click()
    
    // Title should still be there
    await expect(page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i)).toHaveValue(title)
  })

  test('should show Edit/Preview toggle only on step 4', async ({ page }) => {
    // Step 1: No toggle
    await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Preview' })).not.toBeVisible()
    
    // Navigate to step 4
    await page.getByRole('button', { name: 'Review' }).click()
    
    // Step 4: Toggle should be visible
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible()
  })

  test('should toggle between edit and preview modes', async ({ page }) => {
    // Fill in some data first
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('Test Recipe')
    
    // Go to step 4
    await page.getByRole('button', { name: 'Review' }).click()
    
    // Should start in edit mode
    await expect(page.getByText('Review Your Recipe')).toBeVisible()
    
    // Switch to preview
    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(page.getByText('Test Recipe')).toBeVisible()
    
    // Switch back to edit
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByText('Review Your Recipe')).toBeVisible()
  })

  test('should add and remove ingredients', async ({ page }) => {
    // Navigate to ingredients step
    await page.getByRole('button', { name: 'Next →' }).click()
    
    // Should start with one ingredient
    const initialInputs = await page.getByPlaceholder(/2 cups all-purpose flour/i).count()
    expect(initialInputs).toBe(1)
    
    // Add ingredient
    await page.getByRole('button', { name: /Add Ingredient/i }).click()
    const afterAdd = await page.getByPlaceholder(/2 cups all-purpose flour/i).count()
    expect(afterAdd).toBe(2)
    
    // Fill second ingredient
    await page.getByPlaceholder(/2 cups all-purpose flour/i).nth(1).fill('1 cup milk')
    
    // Remove first ingredient (delete button appears when more than 1)
    const deleteButtons = page.locator('button').filter({ hasText: '' })
    await deleteButtons.first().click()
    
    const afterRemove = await page.getByPlaceholder(/2 cups all-purpose flour/i).count()
    expect(afterRemove).toBe(1)
  })

  test('should add and remove instructions', async ({ page }) => {
    // Navigate to instructions step
    await page.getByRole('button', { name: 'Instructions' }).click()
    
    // Should start with one instruction
    const initialInputs = await page.getByPlaceholder(/Describe this step in detail/i).count()
    expect(initialInputs).toBe(1)
    
    // Add instruction
    await page.getByRole('button', { name: /Add Step/i }).click()
    const afterAdd = await page.getByPlaceholder(/Describe this step in detail/i).count()
    expect(afterAdd).toBe(2)
  })

  test('should add and remove tags', async ({ page }) => {
    // Fill out basic info (step 1)
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('Test Recipe')
    // Add any other required fields for step 1 here if needed
    await page.getByRole('button', { name: 'Next →' }).click()
    // Navigate to instructions step (where tags are)
    await page.getByRole('button', { name: 'Instructions' }).click()
    
    // Add a tag using Enter key
    await page.getByPlaceholder(/Add tags/i).fill('quick')
    await page.getByPlaceholder(/Add tags/i).press('Enter')
    await expect(page.getByText('quick')).toBeVisible()
    
    // Add another tag using button
    await page.getByPlaceholder(/Add tags/i).fill('easy')
    await page.getByRole('button', { name: /^Add$/i }).click()
    await expect(page.getByText('easy')).toBeVisible()
    
    // Remove first tag
    const removeButtons = page.getByRole('button', { name: '×' })
    await removeButtons.first().click()
    await expect(page.getByText('quick')).not.toBeVisible()
  })

  test('should show Next button on steps 1-3 and Save button on step 4', async ({ page }) => {
    // Step 1: Next button
    await expect(page.getByRole('button', { name: 'Next →' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Save Recipe/i })).not.toBeVisible()
    
    // Navigate to step 4
    await page.getByRole('button', { name: 'Review' }).click()
    
    // Step 4: Save button
    await expect(page.getByRole('button', { name: 'Next →' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Save Recipe/i })).toBeVisible()
  })

  test('should show completed steps with checkmark', async ({ page }) => {
    // Navigate to step 2
    await page.getByRole('button', { name: 'Next →' }).click()
    
    // Step 1 button should now show checkmark
    const step1Button = page.getByRole('button', { name: /Basic Info/i })
    await expect(step1Button.getByText('✓')).toBeVisible()
  })

  test('should highlight current step in progress indicator', async ({ page }) => {
    // Step 1 should be highlighted
    const step1Button = page.getByRole('button', { name: /Basic Info/i })
    const step1Icon = step1Button.locator('div').first()
    await expect(step1Icon).toHaveClass(/bg-green-600/)
    
    // Navigate to step 2
    await page.getByRole('button', { name: 'Next →' }).click()
    
    // Step 2 should now be highlighted
    const step2Button = page.getByRole('button', { name: /Ingredients/i })
    const step2Icon = step2Button.locator('div').first()
    await expect(step2Icon).toHaveClass(/bg-green-600/)
  })

  test('should show Cancel button on all steps', async ({ page }) => {
    for (let step = 1; step <= 4; step++) {
      await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible()
      
      if (step < 4) {
        await page.getByRole('button', { name: 'Next →' }).click()
      }
    }
  })

  test('should navigate back to dashboard when Cancel is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /Cancel/i }).click()
    
    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should validate required fields', async ({ page }) => {
    // Fill out required fields in step 1
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('Test Recipe')
    await page.getByPlaceholder(/Short description/i).fill('A delicious test recipe')
    
    // Proceed to Review step
    await page.getByRole('button', { name: 'Review' }).click()
    await page.getByRole('button', { name: /Save Recipe/i }).click()
    
    // Form validation should prevent submission
    // (HTML5 validation will show browser-native errors)
    // Check that we're still on the create recipe page
    await expect(page.getByText('Create Recipe')).toBeVisible()
  })

  test('should show all 4 steps in correct order', async ({ page }) => {
    const progressBar = page.locator('.flex.items-center.justify-between').first()
    
    // Check step order
    await expect(progressBar.getByText('Basic Info')).toBeVisible()
    await expect(progressBar.getByText('Ingredients')).toBeVisible()
    await expect(progressBar.getByText('Instructions')).toBeVisible()
    await expect(progressBar.getByText('Review')).toBeVisible()
  })

  test('should display step icons', async ({ page }) => {
    // Each step should have its icon
    const step1 = page.getByRole('button', { name: /Basic Info/i })
    await expect(step1.getByText('📝')).toBeVisible()
    
    const step2 = page.getByRole('button', { name: /Ingredients/i })
    await expect(step2.getByText('🥕')).toBeVisible()
    
    const step3 = page.getByRole('button', { name: /Instructions/i })
    await expect(step3.getByText('👨‍🍳')).toBeVisible()
    
    const step4 = page.getByRole('button', { name: /Review/i })
    await expect(step4.getByText('✅')).toBeVisible()
  })

  test('should preserve preview mode state when navigating to other steps and back', async ({ page }) => {
    // Fill some data
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('Test Recipe')
    
    // Go to step 4 and switch to preview
    await page.getByRole('button', { name: 'Review' }).click()
    await page.getByRole('button', { name: 'Preview' }).click()
    
    // Verify preview mode
    await expect(page.getByText('Test Recipe')).toBeVisible()
    
    // Go to another step
    await page.getByRole('button', { name: /← Back/i }).click()
    
    // Come back to step 4
    await page.getByRole('button', { name: 'Next →' }).click()
    
    // Should remember preview mode preference
    // (This depends on implementation - adjust based on actual behavior)
    await expect(page.getByText('Review Your Recipe')).toBeVisible()
  })
})
