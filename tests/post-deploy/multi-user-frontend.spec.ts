/**
 * @post-deploy
 * Post-deployment multi-user frontend E2E tests (Issue #20).
 *
 * Required env vars:
 *   DEPLOYED_APP_URL             - e.g. https://recipe-mgmt-dev.web.app
 *   MANAGEMENT_API_URL           - deployed backend base URL
 *   FIREBASE_ADMIN_SERVICE_ACCOUNT - JSON service account key
 *   FIREBASE_WEB_API_KEY         - Firebase Web API key
 *
 * These tests exercise the app via the browser AND validate auth boundaries
 * at the API level.
 */

import { test, expect } from '@playwright/test'
import { TestUserProvisioner, TestUser } from '../helpers/test-user-provisioner'

const APP_URL = process.env.DEPLOYED_APP_URL ?? ''
const BASE_API = process.env.MANAGEMENT_API_URL ?? ''

/** Inject a Firebase ID token into localStorage so the app treats the
 *  browser session as authenticated. Uses the Firebase Web API key as part
 *  of the storage key, matching Firebase's local persistence format. */
async function injectAuthToken(page: import('@playwright/test').Page, idToken: string, user: TestUser) {
  const webApiKey = process.env.FIREBASE_WEB_API_KEY!
  await page.addInitScript(
    ({ token, uid, email, displayName, apiKey }) => {
      try {
        const key = `firebase:authUser:${apiKey}:[DEFAULT]`
        localStorage.setItem(
          key,
          JSON.stringify({
            uid,
            email,
            displayName,
            emailVerified: true,
            isAnonymous: false,
            providerData: [{ providerId: 'password', uid: email, email, displayName }],
            stsTokenManager: {
              accessToken: token,
              expirationTime: Date.now() + 3_600_000,
            },
            createdAt: Date.now().toString(),
            lastLoginAt: Date.now().toString(),
            apiKey,
            appName: '[DEFAULT]',
          })
        )
      } catch {
        // ignore — page may not have localStorage yet
      }
    },
    { token: idToken, uid: user.uid, email: user.email, displayName: user.displayName, apiKey: webApiKey }
  )
}

test.describe('Multi-user frontend post-deployment @post-deploy', () => {
  test.describe.configure({ mode: 'serial' })

  let provisioner: TestUserProvisioner
  let author: TestUser
  let follower: TestUser
  let recipeId: string

  test.beforeAll(async () => {
    if (
      !APP_URL ||
      !BASE_API ||
      !process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ||
      !process.env.FIREBASE_WEB_API_KEY
    ) {
      test.skip()
      return
    }
    provisioner = new TestUserProvisioner()
    ;[author, follower] = await Promise.all([
      provisioner.createUser('author'),
      provisioner.createUser('follower'),
    ])
  })

  test.afterAll(async () => {
    // Best-effort: delete test recipe via API before cleanup
    if (recipeId && BASE_API && author) {
      await fetch(`${BASE_API}/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${author.idToken}` },
      }).catch(() => undefined)
    }
    await provisioner?.cleanup()
  })

  // ── Author creates and shares a recipe ───────────────────────────────────

  test('author creates a recipe via the API', async ({ request }) => {
    const res = await request.post(`${BASE_API}/api/recipes`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
      data: {
        title: `Frontend E2E Recipe ${provisioner.runId}`,
        description: 'A recipe created during post-deploy frontend tests',
        ingredients: [{ name: 'Flour', quantity: '200', unit: 'g' }],
        instructions: [{ stepNumber: 1, instruction: 'Mix the flour' }],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        isPublic: false,
      },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    recipeId = body.id
    expect(recipeId).toBeTruthy()
  })

  test('author shares the recipe via API', async ({ request }) => {
    const res = await request.patch(`${BASE_API}/api/recipes/${recipeId}/sharing`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
      data: { isPublic: true },
    })
    expect(res.status()).toBe(200)
  })

  // ── Follower views the public recipe in the browser ──────────────────────

  test('follower can view public recipe page', async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: APP_URL })
    const page = await ctx.newPage()
    await injectAuthToken(page, follower.idToken, follower)
    await page.goto(`${APP_URL}/recipes/${recipeId}`, { waitUntil: 'networkidle' })
    // Expect recipe title visible on the recipe detail route
    await expect(page.getByText(`Frontend E2E Recipe ${provisioner.runId}`)).toBeVisible({ timeout: 15000 })
    await ctx.close()
  })

  // ── API-level auth boundary: follower cannot access author's private endpoint ──

  test('follower gets 403 accessing author private recipe via /api/recipes/{id}', async ({ request }) => {
    // Temporarily unshare to make it private again
    await request.patch(`${BASE_API}/api/recipes/${recipeId}/sharing`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
      data: { isPublic: false },
    })

    const res = await request.get(`${BASE_API}/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${follower.idToken}` },
    })
    expect(res.status()).toBe(403)
  })

  test('re-share recipe for remaining tests', async ({ request }) => {
    const res = await request.patch(`${BASE_API}/api/recipes/${recipeId}/sharing`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
      data: { isPublic: true },
    })
    expect(res.status()).toBe(200)
  })

  // ── Follower saves, likes, and follows author via API ────────────────────

  test('follower saves the recipe', async ({ request }) => {
    const res = await request.post(`${BASE_API}/api/recipes/${recipeId}/save`, {
      headers: { Authorization: `Bearer ${follower.idToken}` },
    })
    expect([200, 201, 204]).toContain(res.status())
  })

  test('follower likes the recipe', async ({ request }) => {
    const res = await request.post(`${BASE_API}/api/recipes/${recipeId}/like`, {
      headers: { Authorization: `Bearer ${follower.idToken}` },
    })
    expect([200, 201, 204]).toContain(res.status())
  })

  test('follower follows author', async ({ request }) => {
    const res = await request.post(`${BASE_API}/api/users/${author.uid}/follow`, {
      headers: { Authorization: `Bearer ${follower.idToken}` },
    })
    expect([200, 201, 204]).toContain(res.status())
  })

  // ── Author's copy-link produces a public URL ─────────────────────────────

  test('public recipe URL is accessible without auth', async ({ request }) => {
    const res = await request.get(`${BASE_API}/api/recipes/${recipeId}/public`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(recipeId)
  })
})
