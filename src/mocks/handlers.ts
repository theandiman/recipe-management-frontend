import { http, HttpResponse } from 'msw'

export const handlers = [
  // Recipes list
  http.get('/api/recipes', () => {
    return HttpResponse.json([
      {
        id: 'mock-recipe-1',
        title: 'Classic Garlic Pasta',
        description: 'Simple and delicious Italian pasta with garlic and olive oil.',
        servings: 2,
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        ingredients: [
          { name: 'Spaghetti', amount: 200, unit: 'g' },
          { name: 'Garlic cloves', amount: 4, unit: 'cloves' },
          { name: 'Olive oil', amount: 3, unit: 'tbsp' }
        ],
        instructions: ['Boil pasta.', 'Sauté garlic in olive oil.', 'Toss together.'],
        isPublic: true,
        createdAt: '2026-08-27T10:00:00Z',
        updatedAt: '2026-08-27T10:00:00Z'
      }
    ])
  }),

  // AI Recipe Generation
  http.post('/api/recipes/generate', async ({ request }) => {
    const body = (await request.json()) as { prompt?: string }
    return HttpResponse.json({
      title: `Generated: ${body.prompt || 'Delicious Recipe'}`,
      description: 'An AI created recipe tailored for you.',
      servings: 4,
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      ingredients: [{ name: 'Secret Ingredient', amount: 1, unit: 'pinch' }],
      instructions: ['Follow AI instructions to cook.']
    })
  }),

  // Health check
  http.get('/actuator/health', () => {
    return HttpResponse.json({ status: 'UP' })
  })
]
