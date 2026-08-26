import { test, expect } from '@playwright/test'

test.describe('Authentication & Navigation Guards', () => {
  test('should display login page form with email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible()
    await expect(page.getByLabel(/Email address/i)).toBeVisible()
    await expect(page.getByLabel(/Password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('should display register page form', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /Join CookFlow/i })).toBeVisible()
    await expect(page.getByLabel(/Full name/i)).toBeVisible()
    await expect(page.getByLabel(/Email address/i)).toBeVisible()
    await expect(page.getByLabel(/Password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeVisible()
  })

  test('should allow toggling password visibility on login page', async ({ page }) => {
    await page.goto('/login')
    const passwordInput = page.getByLabel(/Password/i)
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign up' }).click()
    await expect(page).toHaveURL(/\/register/)

    await page.getByRole('button', { name: 'Sign in instead' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
