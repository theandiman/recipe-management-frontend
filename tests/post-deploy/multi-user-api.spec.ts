/**
 * @post-deploy
 * Post-deployment multi-user API tests (Issue #21).
 *
 * Required env vars:
 *   MANAGEMENT_API_URL           - deployed backend base URL
 *   FIREBASE_ADMIN_SERVICE_ACCOUNT - JSON service account key
 *   FIREBASE_WEB_API_KEY         - Firebase Web API key
 */

import { test, expect } from '@playwright/test'
import { TestUserProvisioner, TestUser } from '../helpers/test-user-provisioner'

const BASE_API = process.env.MANAGEMENT_API_URL ?? ''

test.describe('Multi-user API post-deployment @post-deploy', () => {
  test.describe.configure({ mode: 'serial' })

  let provisioner: TestUserProvisioner
  let author: TestUser
  let reader: TestUser
  let recipeId: string

  test.beforeAll(async () => {
    if (!BASE_API || !process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || !process.env.FIREBASE_WEB_API_KEY) {
      test.skip()
      return
    }
    provisioner = new TestUserProvisioner()
    ;[author, reader] = await Promise.all([
      provisioner.createUser('author'),
      provisioner.createUser('reader'),
    ])
  })

  test.afterAll(async () => {
    await provisioner?.cleanup()
  })

  // ── CRUD lifecycle (author) ───────────────────────────────────────────────

  test('author can create a recipe', async ({ request }) => {
    const res = await request.post(`${BASE_API}/api/recipes`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
      data: {
        title: `API Test Recipe ${provisioner.runId}`,
        description: 'Created by post-deploy API test',
        ingredients: [{ name: 'Water', quantity: '1', unit: 'cup' }],
        instructions: [{ stepNumber: 1, instruction: 'Boil water' }],
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        servings: 2,
        isPublic: false,
      },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    recipeId = body.id
    expect(recipeId).toBeTruthy()
  })

  test('author can read own private recipe', async ({ request }) => {
    const res = await request.get(`${BASE_API}/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(recipeId)
  })

  test('author can update own recipe', async ({ request }) => {
    const res = await request.put(`${BASE_API}/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
      data: {
        title: `Updated API Test Recipe ${provisioner.runId}`,
        description: 'Updated by post-deploy API test',
        ingredients: [{ name: 'Water', quantity: '2', unit: 'cups' }],
        instructions: [{ stepNumber: 1, instruction: 'Boil water vigorously' }],
        prepTimeMinutes: 5,
        cookTimeMinutes: 15,
        servings: 4,
        isPublic: false,
      },
    })
    expect(res.status()).toBe(200)
  })

  // ── Authorization boundaries (private recipe) ────────────────────────────

  test('non-owner gets 403 accessing a private recipe via /api/recipes/{id}', async ({ request }) => {
    const res = await request.get(`${BASE_API}/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${reader.idToken}` },
    })
    expect(res.status()).toBe(403)
  })

  test('non-owner gets 403 trying to update private recipe', async ({ request }) => {
    const res = await request.put(`${BASE_API}/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${reader.idToken}` },
      data: {
        title: 'Hijacked',
        description: 'Unauthorized update attempt',
        ingredients: [],
        instructions: [],
        prepTimeMinutes: 1,
        cookTimeMinutes: 1,
        servings: 1,
        isPublic: false,
      },
    })
    expect(res.status()).toBe(403)
  })

  test('non-owner gets 403 trying to delete private recipe', async ({ request }) => {
    const res = await request.delete(`${BASE_API}/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${reader.idToken}` },
    })
    expect(res.status()).toBe(403)
  })

  test('unauthenticated request gets 401 on protected endpoint', async ({ request }) => {
    const res = await request.get(`${BASE_API}/api/recipes/${recipeId}`)
    expect([401, 403]).toContain(res.status())
  })

  // ── Share / unshare flow ──────────────────────────────────────────────────

  test('author can share recipe publicly', async ({ request }) => {
    const res = await request.patch(`${BASE_API}/api/recipes/${recipeId}/sharing`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
      data: { isPublic: true },
    })
    expect(res.status()).toBe(200)
  })

  test('anyone can read a public recipe via public endpoint', async ({ request }) => {
    const res = await request.get(`${BASE_API}/api/recipes/${recipeId}/public`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(recipeId)
  })

  test('non-owner can now see recipe in public listing', async ({ request }) => {
    const res = await request.get(`${BASE_API}/api/recipes/public`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    const ids: string[] = (Array.isArray(body) ? body : body.content ?? []).map(
      (r: { id: string }) => r.id
    )
    expect(ids).toContain(recipeId)
  })

  test('reader can save (bookmark) a public recipe', async ({ request }) => {
    const res = await request.post(`${BASE_API}/api/recipes/${recipeId}/save`, {
      headers: { Authorization: `Bearer ${reader.idToken}` },
    })
    expect([200, 201, 204]).toContain(res.status())
  })

  test('reader can like a public recipe', async ({ request }) => {
    const res = await request.post(`${BASE_API}/api/recipes/${recipeId}/like`, {
      headers: { Authorization: `Bearer ${reader.idToken}` },
    })
    expect([200, 201, 204]).toContain(res.status())
  })

  test('reader can follow author', async ({ request }) => {
    const res = await request.post(`${BASE_API}/api/users/${author.uid}/follow`, {
      headers: { Authorization: `Bearer ${reader.idToken}` },
    })
    expect([200, 201, 204]).toContain(res.status())
  })

  test('author profile is publicly visible', async ({ request }) => {
    const res = await request.get(`${BASE_API}/api/users/${author.uid}/profile`)
    expect(res.status()).toBe(200)
  })

  test('reader can unlike a recipe', async ({ request }) => {
    const res = await request.delete(`${BASE_API}/api/recipes/${recipeId}/like`, {
      headers: { Authorization: `Bearer ${reader.idToken}` },
    })
    expect([200, 204]).toContain(res.status())
  })

  test('reader can unsave (unbookmark) a recipe', async ({ request }) => {
    const res = await request.delete(`${BASE_API}/api/recipes/${recipeId}/save`, {
      headers: { Authorization: `Bearer ${reader.idToken}` },
    })
    expect([200, 204]).toContain(res.status())
  })

  test('reader can unfollow author', async ({ request }) => {
    const res = await request.delete(`${BASE_API}/api/users/${author.uid}/follow`, {
      headers: { Authorization: `Bearer ${reader.idToken}` },
    })
    expect([200, 204]).toContain(res.status())
  })

  test('author can unshare recipe', async ({ request }) => {
    const res = await request.patch(`${BASE_API}/api/recipes/${recipeId}/sharing`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
      data: { isPublic: false },
    })
    expect(res.status()).toBe(200)
  })

  // ── Cleanup: author deletes own recipe ────────────────────────────────────

  test('author can delete own recipe', async ({ request }) => {
    const res = await request.delete(`${BASE_API}/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${author.idToken}` },
    })
    expect([200, 204]).toContain(res.status())
  })
})
