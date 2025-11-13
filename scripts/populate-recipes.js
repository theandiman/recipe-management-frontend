#!/usr/bin/env node

/**
 * Script to populate the database with AI-generated recipes
 * 
 * Usage:
 *   node scripts/populate-recipes.js [count]
 * 
 * Environment variables required:
 *   - VITE_API_URL: The API base URL
 *   - VITE_STORAGE_API_URL: The storage API base URL
 *   - FIREBASE_ID_TOKEN: Firebase ID token for authentication
 * 
 * Example:
 *   FIREBASE_ID_TOKEN="your-token" node scripts/populate-recipes.js 50
 */

import axios from 'axios'

// Recipe prompts for variety
const RECIPE_PROMPTS = [
  // Breakfast
  'classic pancakes with maple syrup',
  'fluffy scrambled eggs with herbs',
  'overnight oats with berries',
  'avocado toast with poached egg',
  'french toast with cinnamon',
  'breakfast burrito with eggs and cheese',
  'greek yogurt parfait with granola',
  'blueberry muffins',
  'banana bread',
  'eggs benedict',
  
  // Lunch
  'chicken caesar salad',
  'turkey and avocado sandwich',
  'tomato soup with grilled cheese',
  'quinoa buddha bowl',
  'tuna salad wrap',
  'caprese salad with balsamic',
  'chicken quesadilla',
  'mediterranean chickpea salad',
  'grilled chicken wrap',
  'vegetable stir fry',
  
  // Dinner
  'spaghetti carbonara',
  'grilled salmon with asparagus',
  'chicken parmesan',
  'beef tacos with fresh salsa',
  'vegetable curry with rice',
  'baked chicken thighs with roasted vegetables',
  'shrimp scampi pasta',
  'beef and broccoli stir fry',
  'stuffed bell peppers',
  'chicken teriyaki',
  'lasagna with meat sauce',
  'pulled pork sandwiches',
  'fish tacos',
  'butter chicken',
  'pad thai',
  
  // Appetizers & Snacks
  'spinach and artichoke dip',
  'buffalo chicken wings',
  'bruschetta with tomatoes',
  'guacamole with chips',
  'deviled eggs',
  'cheese and charcuterie board',
  'hummus with vegetables',
  'mozzarella sticks',
  
  // Desserts
  'chocolate chip cookies',
  'brownies',
  'apple pie',
  'tiramisu',
  'cheesecake with berry topping',
  'creme brulee',
  'chocolate mousse',
  'lemon bars',
  'carrot cake',
  'panna cotta',
  
  // Vegetarian/Vegan
  'lentil soup',
  'veggie burger',
  'roasted vegetable medley',
  'cauliflower fried rice',
  'black bean quesadilla',
  'mushroom risotto',
  'sweet potato curry',
  
  // International
  'pad thai',
  'chicken tikka masala',
  'beef pho',
  'greek moussaka',
  'japanese ramen',
  'spanish paella',
  'moroccan tagine',
  'thai green curry',
  'korean bibimbap',
  'italian risotto',
]

const DIETARY_PREFERENCES = [
  [],
  ['vegetarian'],
  ['vegan'],
  ['gluten-free'],
  ['low-carb'],
  ['high-protein'],
  ['dairy-free'],
]

const ALLERGIES = [
  [],
  ['nuts'],
  ['dairy'],
  ['gluten'],
  ['shellfish'],
]

// Configuration
const API_URL = process.env.VITE_API_URL || 'http://localhost:8080'
const STORAGE_API_URL = process.env.VITE_STORAGE_API_URL || 'http://localhost:8081'
const ID_TOKEN = process.env.FIREBASE_ID_TOKEN
const COUNT = parseInt(process.argv[2] || '50', 10)
const DELAY_MS = 5000 // 5 second delay between requests to avoid rate limiting

if (!ID_TOKEN) {
  console.error('❌ Error: FIREBASE_ID_TOKEN environment variable is required')
  console.error('\nTo get your Firebase ID token:')
  console.error('1. Open the app in your browser')
  console.error('2. Log in to your account')
  console.error('3. Open browser console and run:')
  console.error('   firebase.auth().currentUser.getIdToken().then(token => console.log(token))')
  console.error('\nThen run this script with the token:')
  console.error('   FIREBASE_ID_TOKEN="your-token" node scripts/populate-recipes.js 50')
  process.exit(1)
}

// Helper to make authenticated requests
const postWithAuth = async (url, data) => {
  return axios.post(url, data, {
    headers: {
      'Authorization': `Bearer ${ID_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })
}

// Helper to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Helper to get random element from array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Generate a single recipe
const generateAndSaveRecipe = async (index, total) => {
  const prompt = RECIPE_PROMPTS[index % RECIPE_PROMPTS.length]
  const dietaryPreferences = randomElement(DIETARY_PREFERENCES)
  const allergies = randomElement(ALLERGIES)
  
  console.log(`\n[${index + 1}/${total}] Generating recipe: "${prompt}"`)
  if (dietaryPreferences.length > 0) {
    console.log(`   Dietary preferences: ${dietaryPreferences.join(', ')}`)
  }
  if (allergies.length > 0) {
    console.log(`   Allergies: ${allergies.join(', ')}`)
  }
  
  try {
    // Step 1: Generate recipe
    console.log('   📝 Generating recipe...')
    const generateUrl = `${API_URL}/api/recipes/generate`
    const generateResponse = await postWithAuth(generateUrl, {
      prompt,
      pantryItems: [],
      units: 'metric',
      dietaryPreferences,
      allergies,
      maxTotalMinutes: null
    })
    
    const recipeText = generateResponse.data
    let recipe
    
    try {
      // Try to parse if it's JSON
      recipe = JSON.parse(recipeText)
    } catch {
      // If not JSON, wrap in object
      recipe = { rawText: recipeText }
    }
    
    console.log(`   ✅ Recipe generated: ${recipe.title || 'Untitled'}`)
    
    // Step 2: Generate image (optional, but nice to have)
    try {
      console.log('   🖼️  Generating image...')
      const imageUrl = `${API_URL}/api/recipes/image/generate`
      const imageResponse = await postWithAuth(imageUrl, {
        recipe: recipe
      })
      
      if (imageResponse.data && imageResponse.data.imageUrl) {
        recipe.imageUrl = imageResponse.data.imageUrl
        console.log('   ✅ Image generated')
      }
    } catch (error) {
      console.log('   ⚠️  Image generation skipped:', error.message)
    }
    
    // Step 3: Save recipe to storage
    console.log('   💾 Saving recipe...')
    
    // Map recipe to storage format
    const recipeRequest = {
      title: recipe.title || prompt,
      description: recipe.description || '',
      prepTime: recipe.prepTime || 15,
      cookTime: recipe.cookTime || 30,
      servings: recipe.servings || 4,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      tags: recipe.tags || [],
      imageUrl: recipe.imageUrl || null,
      source: 'ai-generated',
      originalRecipe: recipe.originalRecipe || null
    }
    
    const saveUrl = `${STORAGE_API_URL}/api/recipes`
    const saveResponse = await postWithAuth(saveUrl, recipeRequest)
    
    console.log(`   ✅ Recipe saved with ID: ${saveResponse.data.id}`)
    
    return {
      success: true,
      id: saveResponse.data.id,
      title: recipe.title || prompt
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    if (error.response) {
      console.error(`   Response status: ${error.response.status}`)
      console.error(`   Response data:`, error.response.data)
    }
    return {
      success: false,
      error: error.message
    }
  }
}

// Main function
const main = async () => {
  console.log('🍳 Recipe Database Population Script')
  console.log('====================================')
  console.log(`API URL: ${API_URL}`)
  console.log(`Storage API URL: ${STORAGE_API_URL}`)
  console.log(`Target count: ${COUNT} recipes`)
  console.log(`Delay between requests: ${DELAY_MS}ms`)
  console.log('')
  
  const results = []
  const startTime = Date.now()
  
  for (let i = 0; i < COUNT; i++) {
    const result = await generateAndSaveRecipe(i, COUNT)
    results.push(result)
    
    // Add delay between requests (except after the last one)
    if (i < COUNT - 1) {
      console.log(`   ⏳ Waiting ${DELAY_MS / 1000}s before next recipe...`)
      await delay(DELAY_MS)
    }
  }
  
  const endTime = Date.now()
  const durationSeconds = Math.round((endTime - startTime) / 1000)
  
  // Summary
  console.log('\n\n📊 Summary')
  console.log('==========')
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  console.log(`✅ Successful: ${successful.length}`)
  console.log(`❌ Failed: ${failed.length}`)
  console.log(`⏱️  Duration: ${durationSeconds}s`)
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully created recipes:')
    successful.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title} (ID: ${r.id})`)
    })
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed recipes:')
    failed.forEach((r, i) => {
      console.log(`   ${i + 1}. Error: ${r.error}`)
    })
  }
  
  console.log('\n✨ Done!')
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
