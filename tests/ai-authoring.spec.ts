/**
 * E2E tests for AI-assisted recipe authoring flows.
 *
 * BDD Scenarios:
 *   Scenario 1: AI field suggestion apply flow
 *   Scenario 2: AI field suggestion dismiss flow
 *   Scenario 3: AI suggestion failure fallback
 *   Scenario 4: AI audit trail undo
 *   Scenario 5: Create flow is fully usable with AI suggestions active
 *
 * All AI API calls are intercepted via page.route() — no real network calls are made.
 */

import { test, expect, type Page } from '@playwright/test'

// ─── Shared mock payloads ──────────────────────────────────────────────────────

const SUGGEST_FIELDS_RESPONSE = {
  suggestions: [
    {
      field: 'description',
      suggestedValue: 'A delicious test recipe with rich flavors',
      reason: 'No description provided',
    },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mock the suggest-fields endpoint with a successful response containing one description suggestion. */
async function mockSuggestFieldsSuccess(page: Page) {
  await page.route('**/api/recipes/suggest-fields', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SUGGEST_FIELDS_RESPONSE),
    })
  })
}

/** Mock the suggest-fields endpoint to return a server error. */
async function mockSuggestFieldsError(page: Page) {
  await page.route('**/api/recipes/suggest-fields', async route => {
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"AI service unavailable"}' })
  })
}

/** Mock the refine-instructions endpoint so step-3 navigation never blocks on real network. */
async function mockRefineInstructionsSuccess(page: Page) {
  await page.route('**/api/recipes/refine-instructions', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        refinements: [
          {
            stepIndex: 0,
            original: 'mix',
            refined: 'Mix all ingredients together until smooth',
            changesSummary: 'Expanded the step with clearer mixing instructions.',
          },
        ],
      }),
    })
  })
}

/** Mock the normalize-ingredients endpoint (backend feature, frontend integration point). */
async function mockNormalizeIngredients(page: Page) {
  await page.route('**/api/recipes/normalize-ingredients', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        normalizations: [
          {
            original: 'some flour',
            normalized: '2 cups all-purpose flour',
            reason: 'Ambiguous quantity',
            confidence: 'HIGH',
          },
        ],
      }),
    })
  })
}

/** Fill the recipe title on step 1, then click the AI assist button to trigger suggestions. */
async function fillRecipeTitle(page: Page, title = 'Test Recipe') {
  await page.goto('/dashboard/create')
  await page.waitForLoadState('networkidle')
  await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill(title)
  // AI enhancement is now on-demand — click the button to fetch suggestions
  await page.getByRole('button', { name: /^AI assist$/i }).click()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('AI-assisted authoring — field suggestions', () => {

  // ── Scenario 1: Apply flow ──────────────────────────────────────────────────
  test('Scenario 1: applying an AI suggestion updates the target field', async ({ page }) => {
    await mockSuggestFieldsSuccess(page)
    await mockRefineInstructionsSuccess(page)

    await fillRecipeTitle(page)

    // The suggestion panel should appear (auto-triggered after title is entered)
    const panel = page.getByRole('region', { name: /AI field suggestions/i })
    await expect(panel).toBeVisible({ timeout: 8000 })

    // Wait for the description suggestion card
    const applyBtn = page.getByRole('button', { name: /Apply AI suggestion for Description/i })
    await expect(applyBtn).toBeVisible({ timeout: 5000 })

    // The description field should be empty before applying
    const descriptionField = page.getByPlaceholder(/Brief description/i)
    await expect(descriptionField).toHaveValue('')

    // Apply the suggestion
    await applyBtn.click()

    // The description field should now contain the suggested value
    await expect(descriptionField).toHaveValue(SUGGEST_FIELDS_RESPONSE.suggestions[0].suggestedValue)
  })

  // ── Scenario 2: Dismiss flow ────────────────────────────────────────────────
  test('Scenario 2: dismissing an AI suggestion removes it without changing the field', async ({ page }) => {
    await mockSuggestFieldsSuccess(page)
    await mockRefineInstructionsSuccess(page)

    await fillRecipeTitle(page)

    const panel = page.getByRole('region', { name: /AI field suggestions/i })
    await expect(panel).toBeVisible({ timeout: 8000 })

    const dismissBtn = page.getByRole('button', { name: /Dismiss AI suggestion for Description/i })
    await expect(dismissBtn).toBeVisible({ timeout: 5000 })

    // Record the current description value (should be empty)
    const descriptionField = page.getByPlaceholder(/Brief description/i)
    await expect(descriptionField).toHaveValue('')

    // Dismiss the suggestion
    await dismissBtn.click()

    // Suggestion card should disappear
    await expect(dismissBtn).not.toBeVisible()

    // Field value must remain unchanged
    await expect(descriptionField).toHaveValue('')
  })

  // ── Scenario 3: Failure fallback ────────────────────────────────────────────
  test('Scenario 3: AI suggestion failure shows error state but form remains usable', async ({ page }) => {
    await mockSuggestFieldsError(page)
    await mockRefineInstructionsSuccess(page)

    await fillRecipeTitle(page)

    // Error state should appear in the panel
    const panel = page.getByRole('region', { name: /AI field suggestions/i })
    await expect(panel).toBeVisible({ timeout: 8000 })

    // Panel should show error / warning indicator (⚠️ text or error state)
    await expect(panel.getByText(/Could not load suggestions|AI service unavailable|⚠️/i)).toBeVisible({ timeout: 5000 })

    // Form must still be usable — title and description fields should be accessible
    const titleField = page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i)
    await expect(titleField).toBeEnabled()
    await expect(titleField).toHaveValue('Test Recipe')

    const descriptionField = page.getByPlaceholder(/Brief description/i)
    await expect(descriptionField).toBeEnabled()
    await descriptionField.fill('Manually written description')
    await expect(descriptionField).toHaveValue('Manually written description')

    // Next button should still function
    await expect(page.getByRole('button', { name: /Next →/i })).toBeEnabled()
  })

  // ── Scenario 4: Audit trail undo ────────────────────────────────────────────
  test('Scenario 4: undo last AI change reverts the field to its previous value', async ({ page }) => {
    await mockSuggestFieldsSuccess(page)
    await mockRefineInstructionsSuccess(page)

    await fillRecipeTitle(page)

    const panel = page.getByRole('region', { name: /AI field suggestions/i })
    await expect(panel).toBeVisible({ timeout: 8000 })

    const applyBtn = page.getByRole('button', { name: /Apply AI suggestion for Description/i })
    await expect(applyBtn).toBeVisible({ timeout: 5000 })

    const descriptionField = page.getByPlaceholder(/Brief description/i)
    const originalValue = await descriptionField.inputValue()

    // Apply the suggestion so the audit trail records the change
    await applyBtn.click()
    await expect(descriptionField).toHaveValue(SUGGEST_FIELDS_RESPONSE.suggestions[0].suggestedValue)

    // The undo button should now appear
    const undoBtn = page.getByRole('button', { name: /Undo: Description/i })
    await expect(undoBtn).toBeVisible({ timeout: 3000 })

    // Undo the change
    await undoBtn.click()

    // The description field should revert to its original (empty) value
    await expect(descriptionField).toHaveValue(originalValue)

    // Undo button should be gone once there's nothing left to undo
    await expect(undoBtn).not.toBeVisible()
  })

  // ── Scenario 5: Full create flow with AI suggestions active ─────────────────
  test('Scenario 5: full create flow completes successfully with mocked AI suggestions', async ({ page }) => {
    // Mock all AI endpoints that may be called during the create flow
    await mockSuggestFieldsSuccess(page)
    await mockRefineInstructionsSuccess(page)
    await mockNormalizeIngredients(page)

    await page.goto('/dashboard/create')
    await page.waitForLoadState('networkidle')

    // ── Step 1: Basic Info ──────────────────────────────────────────────────
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible()

    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('My Test Cake')
    // Click AI assist to request suggestions (on-demand trigger)
    await page.getByRole('button', { name: /^AI assist$/i }).click()
    // Wait for the AI suggestion panel to load
    const panel = page.getByRole('region', { name: /AI field suggestions/i })
    await expect(panel).toBeVisible({ timeout: 8000 })

    // Fill description manually (ignoring or after AI suggestion appears)
    await page.getByPlaceholder(/Brief description/i).fill('A rich chocolate cake')

    await page.getByRole('button', { name: 'Next →' }).click()

    // ── Step 2: Ingredients ────────────────────────────────────────────────
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible()

    // Ingredients step — fill an ambiguous ingredient to verify the normalize endpoint
    // is ready to be called when the UI integrates it
    await page.getByPlaceholder(/e.g., all-purpose flour/i).fill('some flour')

    await page.getByRole('button', { name: 'Next →' }).click()

    // ── Step 3: Instructions ──────────────────────────────────────────────
    await expect(page.getByText(/Step 3 of 5/i)).toBeVisible()
    await page.getByPlaceholder(/Describe this step in detail/i).first().fill('Mix all dry ingredients')

    await page.getByRole('button', { name: 'Next →' }).click()

    // ── Step 4: Additional Info ───────────────────────────────────────────
    await expect(page.getByText(/Step 4 of 5/i)).toBeVisible()
    await page.getByPlaceholder('15').fill('20')
    await page.getByPlaceholder('30').fill('45')
    await page.getByPlaceholder('4').fill('8')

    await page.getByRole('button', { name: 'Next →' }).click()

    // ── Step 5: Review ────────────────────────────────────────────────────
    await expect(page.getByText(/Step 5 of 5/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'My Test Cake' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Save Recipe/i })).toBeVisible()
  })
})

// ── Edit flow: suggestions persist across step navigation ─────────────────────
test.describe('AI-assisted authoring — edit flow', () => {
  test('Scenario 6: AI suggestions panel persists across step navigation (edit-mode simulation)', async ({ page }) => {
    // This test simulates the AI suggestion panel behaviour that applies equally
    // to the create and edit flows — once suggestions are fetched, navigating
    // between steps must not clear the panel.
    await mockSuggestFieldsSuccess(page)
    await mockRefineInstructionsSuccess(page)

    await page.goto('/dashboard/create')
    await page.waitForLoadState('networkidle')

    // Fill a title and click AI assist to trigger suggestion fetch
    await page.getByPlaceholder(/Grandma's Chocolate Chip Cookies/i).fill('Existing Cake')
    await page.getByRole('button', { name: /^AI assist$/i }).click()
    const panel = page.getByRole('region', { name: /AI field suggestions/i })
    await expect(panel).toBeVisible({ timeout: 8000 })

    // Navigate forward to step 2
    await page.getByRole('button', { name: 'Next →' }).click()
    await expect(page.getByText(/Step 2 of 5/i)).toBeVisible()

    // Navigate back to step 1
    await page.getByRole('button', { name: '← Back' }).click()
    await expect(page.getByText(/Step 1 of 5/i)).toBeVisible()

    // Suggestions panel should still be visible (state is preserved across navigation)
    await expect(panel).toBeVisible({ timeout: 5000 })

    // The suggestion card for description should still be present
    const applyBtn = page.getByRole('button', { name: /Apply AI suggestion for Description/i })
    await expect(applyBtn).toBeVisible()
  })
})
