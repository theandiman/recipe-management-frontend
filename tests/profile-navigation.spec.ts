import { test, expect } from '@playwright/test'

test.describe('User Profile Navigation & Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend profile endpoints with mock data
    await page.route('**/api/users/me/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            uid: 'test-user-123',
            displayName: 'Chef Andy',
            bio: 'Cooking passionate recipes everyday.',
            avatarUrl: '',
            visibility: 'PUBLIC',
            followerCount: 12,
            followingCount: 5,
            publicRecipeCount: 3,
            publicRecipes: [],
            isFollowedByCurrentUser: false,
          }),
        })
      } else if (route.request().method() === 'PUT') {
        const body = JSON.parse(route.request().postData() || '{}')
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            uid: 'test-user-123',
            displayName: body.displayName || 'Chef Andy Updated',
            bio: body.bio || 'Updated bio',
            avatarUrl: body.avatarUrl || '',
            visibility: body.visibility || 'PUBLIC',
            followerCount: 12,
            followingCount: 5,
            publicRecipeCount: 3,
            publicRecipes: [],
            isFollowedByCurrentUser: false,
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.route('**/api/users/test-user-123/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uid: 'test-user-123',
          displayName: 'Chef Andy',
          bio: 'Cooking passionate recipes everyday.',
          avatarUrl: '',
          visibility: 'PUBLIC',
          followerCount: 12,
          followingCount: 5,
          publicRecipeCount: 3,
          publicRecipes: [],
          isFollowedByCurrentUser: false,
        }),
      })
    })

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should render My Profile navigation link in sidebar and profile header button', async ({ page }) => {
    await expect(page.getByRole('link', { name: /My Profile/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /My Profile/i })).toBeVisible()
  })

  test('should navigate to profile page via sidebar link', async ({ page }) => {
    await page.getByRole('link', { name: /My Profile/i }).click()
    await expect(page).toHaveURL(/\/dashboard\/profile|\/user\//)
    await expect(page.getByRole('heading', { name: 'Chef Andy' })).toBeVisible()
  })

  test('should navigate to profile page via header profile button', async ({ page }) => {
    await page.getByRole('button', { name: /My Profile/i }).click()
    await expect(page).toHaveURL(/\/dashboard\/profile|\/user\//)
    await expect(page.getByRole('heading', { name: 'Chef Andy' })).toBeVisible()
  })

  test('should open ProfileSettingsModal when Edit Profile button is clicked', async ({ page }) => {
    await page.goto('/dashboard/profile')
    await expect(page.getByRole('heading', { name: 'Chef Andy' })).toBeVisible()

    const editButton = page.getByRole('button', { name: /Edit profile/i })
    await expect(editButton).toBeVisible()
    await editButton.click()

    await expect(page.getByRole('heading', { name: 'Edit Profile' })).toBeVisible()
    await expect(page.getByLabel(/Display Name/i)).toHaveValue('Chef Andy')
    await expect(page.getByLabel(/Bio/i)).toHaveValue('Cooking passionate recipes everyday.')
  })

  test('should update profile display name and bio in ProfileSettingsModal', async ({ page }) => {
    await page.goto('/dashboard/profile')
    await page.getByRole('button', { name: /Edit profile/i }).click()

    await page.getByLabel(/Display Name/i).fill('Master Chef Andy')
    await page.getByLabel(/Bio/i).fill('Exploring gourmet Italian and French cuisine.')
    
    await page.getByRole('button', { name: /Save changes/i }).click()

    await expect(page.getByRole('heading', { name: 'Edit Profile' })).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'Master Chef Andy' })).toBeVisible()
    await expect(page.getByText('Exploring gourmet Italian and French cuisine.')).toBeVisible()
  })

  test('should allow canceling changes in ProfileSettingsModal', async ({ page }) => {
    await page.goto('/dashboard/profile')
    await page.getByRole('button', { name: /Edit profile/i }).click()

    await page.getByLabel(/Display Name/i).fill('Temporary Name')
    await page.getByRole('button', { name: /Cancel/i }).click()

    await expect(page.getByRole('heading', { name: 'Edit Profile' })).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'Chef Andy' })).toBeVisible()
  })
})
