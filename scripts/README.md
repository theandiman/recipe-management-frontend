# Recipe Database Population Scripts

This directory contains scripts for populating the database with AI-generated recipes.

## Quick Start

### Option 1: Using the Token Helper Page (Easiest)

1. Start the dev server with the token helper page:
   ```bash
   npm run dev
   ```

2. Open the token helper page in your browser:
   ```
   http://localhost:5173/scripts/get-firebase-token.html
   ```

3. Click "Get Token" and sign in if needed

4. Copy the command shown and run it in your terminal

### Option 2: Manual Token Retrieval

1. Open your app in the browser and log in

2. Open the browser console and run:
   ```javascript
   firebase.auth().currentUser.getIdToken().then(token => console.log(token))
   ```

3. Copy the token and run:
   ```bash
   FIREBASE_ID_TOKEN="your-token-here" node scripts/populate-recipes.js 50
   ```

## Scripts

### `populate-recipes.js`

Generates and saves recipes using the AI endpoint.

**Usage:**
```bash
FIREBASE_ID_TOKEN="token" node scripts/populate-recipes.js [count]
```

**Arguments:**
- `count` - Number of recipes to generate (default: 50)

**Environment Variables:**
- `FIREBASE_ID_TOKEN` - **Required** - Your Firebase authentication token
- `VITE_API_URL` - API base URL (default: http://localhost:8080)
- `VITE_STORAGE_API_URL` - Storage API base URL (default: http://localhost:8081)

**Examples:**
```bash
# Generate 50 recipes (default)
FIREBASE_ID_TOKEN="eyJhbGc..." node scripts/populate-recipes.js

# Generate 10 recipes
FIREBASE_ID_TOKEN="eyJhbGc..." node scripts/populate-recipes.js 10

# Generate 100 recipes
FIREBASE_ID_TOKEN="eyJhbGc..." node scripts/populate-recipes.js 100

# Use custom API URLs
FIREBASE_ID_TOKEN="eyJhbGc..." \
VITE_API_URL="https://api.example.com" \
VITE_STORAGE_API_URL="https://storage.example.com" \
node scripts/populate-recipes.js 50
```

**Features:**
- 📝 Generates diverse recipes (breakfast, lunch, dinner, desserts, etc.)
- 🎲 Randomizes dietary preferences and allergies
- 🖼️ Attempts to generate images for each recipe
- ⏱️ Includes delay between requests to avoid rate limiting
- 📊 Provides detailed progress and summary

**Recipe Variety:**
The script includes 70+ different recipe prompts covering:
- Breakfast items (pancakes, eggs, oatmeal, etc.)
- Lunch options (salads, sandwiches, soups, etc.)
- Dinner entrees (pasta, chicken, beef, seafood, etc.)
- Appetizers and snacks
- Desserts
- Vegetarian/vegan options
- International cuisines

### `get-firebase-token.html`

A simple web page that helps you get your Firebase ID token through a visual interface.

**Features:**
- 🔐 Secure Firebase authentication
- 📋 One-click token copying
- 💻 Ready-to-use command generation
- ✨ User-friendly interface

## Configuration

### Rate Limiting

The script includes a 5-second delay between requests by default to avoid overwhelming the API. You can modify the `DELAY_MS` constant in `populate-recipes.js` if needed.

### Recipe Prompts

You can customize the recipe prompts by editing the `RECIPE_PROMPTS` array in `populate-recipes.js`. The script will cycle through these prompts.

### Dietary Preferences & Allergies

The script randomly applies dietary preferences and allergies to create variety. You can modify these arrays in `populate-recipes.js`:
- `DIETARY_PREFERENCES` - vegetarian, vegan, gluten-free, etc.
- `ALLERGIES` - nuts, dairy, gluten, shellfish, etc.

## Troubleshooting

### "FIREBASE_ID_TOKEN environment variable is required"
You need to provide a valid Firebase authentication token. See the Quick Start section above.

### "User not authenticated" error
Your token may have expired. Firebase ID tokens are valid for 1 hour. Get a fresh token using one of the methods above.

### Rate limiting errors
If you're getting rate limited, increase the `DELAY_MS` value in the script or reduce the number of recipes.

### "Failed to generate recipe" errors
- Check that your API backend is running
- Verify the API URL is correct
- Check API logs for specific errors
- Ensure your OpenAI API key is configured properly in the backend

### Image generation fails
Image generation is optional. The script will continue and save recipes without images if image generation fails. Check:
- OpenAI API key has access to DALL-E
- API rate limits haven't been exceeded
- Check backend logs for specific image generation errors

## Tips

- **Start small**: Test with 5-10 recipes first to ensure everything works
- **Monitor progress**: The script provides detailed progress output for each recipe
- **Check results**: After running, verify recipes in your app's recipe library
- **Batch processing**: For large numbers (100+), consider running in smaller batches
- **Token refresh**: If populating many recipes, you may need to refresh your token

## Example Output

```
🍳 Recipe Database Population Script
====================================
API URL: http://localhost:8080
Storage API URL: http://localhost:8081
Target count: 50 recipes
Delay between requests: 5000ms

[1/50] Generating recipe: "classic pancakes with maple syrup"
   📝 Generating recipe...
   ✅ Recipe generated: Fluffy Buttermilk Pancakes
   🖼️  Generating image...
   ✅ Image generated
   💾 Saving recipe...
   ✅ Recipe saved with ID: abc123
   ⏳ Waiting 5s before next recipe...

[2/50] Generating recipe: "fluffy scrambled eggs with herbs"
   Dietary preferences: vegetarian
   📝 Generating recipe...
   ...

📊 Summary
==========
✅ Successful: 48
❌ Failed: 2
⏱️  Duration: 412s

✅ Successfully created recipes:
   1. Fluffy Buttermilk Pancakes (ID: abc123)
   2. Herbed Scrambled Eggs (ID: def456)
   ...

✨ Done!
```

## Security Note

⚠️ **Never commit your Firebase ID token to version control!** The token grants access to your Firebase account and should be kept secret.
