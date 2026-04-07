import { test, expect } from '@playwright/test'

test.describe('Simple Create Recipe (Quick Entry)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/create/simple')
  })

  // ─── Layout ──────────────────────────────────────────────────────────────────

  test('should display the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Recipe' })).toBeVisible()
  })

  test('should show the mode toggle with both options', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: /Recipe creation mode/i })
    await expect(nav).toBeVisible()
    await expect(nav.getByText(/Guided/i)).toBeVisible()
    await expect(nav.getByRole('link', { name: /Quick entry/i })).toBeVisible()
  })

  test('should mark Quick entry tab as selected', async ({ page }) => {
    const quickLink = page.getByRole('navigation', { name: /Recipe creation mode/i })
      .getByRole('link', { name: /Quick entry/i })
    await expect(quickLink).toHaveAttribute('aria-current', 'page')
  })

  test('should always show required fields', async ({ page }) => {
    await expect(page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i)).toBeVisible()
    await expect(page.getByPlaceholder(/Brief description/i)).toBeVisible()
    await expect(page.getByPlaceholder(/e.g., all-purpose flour/i)).toBeVisible()
    await expect(page.getByPlaceholder(/Describe this step in detail/i)).toBeVisible()
  })

  test('should show Save Recipe and Cancel buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Save Recipe/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible()
  })

  // ─── Optional sections collapsed by default ───────────────────────────────────

  test('all optional sections should be collapsed by default', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Timing/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    await expect(page.getByRole('button', { name: /Serving Info/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    await expect(page.getByRole('button', { name: /Tags & Dietary/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    await expect(page.getByRole('button', { name: /Photo/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  // ─── Expand / collapse ────────────────────────────────────────────────────────

  test('should expand Timing section and show prep/cook inputs', async ({ page }) => {
    await page.getByRole('button', { name: /Timing/i }).click()
    await expect(page.getByRole('button', { name: /Timing/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    await expect(page.getByLabel(/Prep Time/i)).toBeVisible()
    await expect(page.getByLabel(/Cook Time/i)).toBeVisible()
  })

  test('should expand Serving Info section and show servings input', async ({ page }) => {
    await page.getByRole('button', { name: /Serving Info/i }).click()
    await expect(page.getByLabel(/Servings/i)).toBeVisible()
  })

  test('should expand Tags & Dietary section and show tag input', async ({ page }) => {
    await page.getByRole('button', { name: /Tags & Dietary/i }).click()
    await expect(page.getByPlaceholder(/Add tags/i)).toBeVisible()
  })

  test('should expand Photo section and show upload area', async ({ page }) => {
    await page.getByRole('button', { name: /Photo/i }).click()
    await expect(page.getByText(/Click to upload/i)).toBeVisible()
  })

  test('should collapse an open section when clicked again', async ({ page }) => {
    const timingBtn = page.getByRole('button', { name: /Timing/i })
    await timingBtn.click()
    await expect(timingBtn).toHaveAttribute('aria-expanded', 'true')
    await timingBtn.click()
    await expect(timingBtn).toHaveAttribute('aria-expanded', 'false')
  })

  test('should expand and collapse sections independently', async ({ page }) => {
    await page.getByRole('button', { name: /Timing/i }).click()
    await page.getByRole('button', { name: /Photo/i }).click()

    await expect(page.getByRole('button', { name: /Timing/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    await expect(page.getByRole('button', { name: /Serving Info/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    await expect(page.getByRole('button', { name: /Photo/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  // ─── Filled indicator ─────────────────────────────────────────────────────────

  test('should show filled indicator on Timing section after entering prep time', async ({
    page,
  }) => {
    // Expand, fill, then collapse
    await page.getByRole('button', { name: /Timing/i }).click()
    await page.getByLabel(/Prep Time/i).fill('20')
    await page.getByRole('button', { name: /Timing/i }).click()

    // Badge should now be visible on the collapsed header
    await expect(page.getByText(/✓ Filled/i)).toBeVisible()
  })

  // ─── Required-field validation ────────────────────────────────────────────────

  test('should show inline error when saving with empty title', async ({ page }) => {
    await page.getByRole('button', { name: /Save Recipe/i }).click()
    await expect(page.getByText(/Recipe name is required/i)).toBeVisible()
  })

  test('should show error when saving with no ingredient item', async ({ page }) => {
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('My Recipe')
    await page.getByRole('button', { name: /Save Recipe/i }).click()
    await expect(page.getByText(/At least one ingredient is required/i)).toBeVisible()
  })

  test('should show error when saving with no instruction', async ({ page }) => {
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('My Recipe')
    await page.getByPlaceholder(/e.g., all-purpose flour/i).fill('Flour')
    await page.getByRole('button', { name: /Save Recipe/i }).click()
    await expect(page.getByText(/At least one instruction is required/i)).toBeVisible()
  })

  // ─── Happy path save ──────────────────────────────────────────────────────────

  test('happy path: fills required fields and saves recipe', async ({ page }) => {
    // Mock the recipe API so save succeeds without a running backend
    await page.route('**/api/recipes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'test-recipe-123', name: 'Quick Pasta' }),
        })
      } else {
        route.continue()
      }
    })

    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('Quick Pasta')
    await page.getByPlaceholder(/Brief description/i).fill('A simple pasta dish')
    await page.getByPlaceholder(/e.g., all-purpose flour/i).fill('Pasta')
    await page.getByPlaceholder(/Describe this step in detail/i).fill('Boil water and cook pasta.')

    await page.getByRole('button', { name: /Save Recipe/i }).click()

    // After save, user is navigated away from the form
    await expect(page).toHaveURL(/\/dashboard\/recipes/, { timeout: 10000 })
  })

  test('happy path: adds optional timing and tags, then saves', async ({ page }) => {
    // Mock the recipe API so save succeeds without a running backend
    await page.route('**/api/recipes', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'test-recipe-456', name: 'Speedy Soup' }),
        })
      } else {
        route.continue()
      }
    })

    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('Speedy Soup')
    await page.getByPlaceholder(/e.g., all-purpose flour/i).fill('Broth')
    await page.getByPlaceholder(/Describe this step in detail/i).fill('Simmer for 20 minutes.')

    // Expand and fill Timing
    await page.getByRole('button', { name: /Timing/i }).click()
    await page.getByLabel(/Prep Time/i).fill('5')
    await page.getByLabel(/Cook Time/i).fill('20')

    // Expand and add a tag
    await page.getByRole('button', { name: /Tags & Dietary/i }).click()
    await page.getByPlaceholder(/Add tags/i).fill('quick')
    await page.keyboard.press('Enter')
    await expect(page.getByText('quick').first()).toBeVisible()

    await page.getByRole('button', { name: /Save Recipe/i }).click()
    await expect(page).toHaveURL(/\/dashboard\/recipes/, { timeout: 10000 })
  })

  // ─── Mode toggle navigation ───────────────────────────────────────────────────

  test('Guided tab should navigate to /dashboard/create', async ({ page }) => {
    await page.getByRole('navigation', { name: /Recipe creation mode/i })
      .getByText(/Guided/i).click()
    await expect(page).toHaveURL(/\/dashboard\/create$/)
  })

  // ─── Existing wizard unaffected ───────────────────────────────────────────────

  test('visiting /dashboard/create still shows the multi-step wizard', async ({ page }) => {
    await page.goto('/dashboard/create')
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible()
    const nav = page.getByRole('navigation', { name: /Recipe creation mode/i })
    await expect(nav.getByRole('link', { name: /Quick entry/i })).toBeVisible()
  })

  // ─── Session storage persistence ─────────────────────────────────────────────

  test('section open state is restored after navigating away and back', async ({ page }) => {
    // Open Timing section
    await page.getByRole('button', { name: /Timing/i }).click()
    await expect(page.getByRole('button', { name: /Timing/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )

    // Navigate away then back
    await page.goto('/dashboard')
    await page.goto('/dashboard/create/simple')

    // Timing should still be open
    await expect(page.getByRole('button', { name: /Timing/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })
})
