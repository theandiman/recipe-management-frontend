# Google OAuth Setup Guide

## The Error You're Seeing

```
The current domain is not authorized for OAuth operations.
Add your domain (localhost) to the OAuth redirect domains list in the Firebase console.
```

## How to Fix It

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your CookFlow project

### Step 2: Navigate to Authentication Settings
1. Click **Authentication** in the left sidebar
2. Click the **Settings** tab
3. Scroll down to **Authorized domains**

### Step 3: Add Your Domains

You should see a list of authorized domains. Make sure these are included:

- `localhost` (for local development)
- Your production domain (e.g., `cookflow.web.app` or your custom domain)

**To add a domain:**
1. Click **Add domain**
2. Enter the domain (e.g., `localhost`)
3. Click **Add**

### Step 4: Enable Google Sign-In Provider

While you're in the Firebase Console:

1. Go to **Authentication** → **Sign-in method** tab
2. Find **Google** in the providers list
3. If it's disabled, click on it and enable it
4. Set the **Project support email** (required)
5. Click **Save**

### Step 5: Test It

1. Reload your app at `http://localhost:5173`
2. Click "Sign in with Google"
3. You should now see the Google sign-in popup

## Troubleshooting

### Popup is blocked
- Allow popups for `localhost` in your browser
- Check browser extensions that might block popups

### Still getting unauthorized domain error
- Make sure you added `localhost` exactly (no `http://` prefix)
- Try adding `localhost:5173` as well
- Clear your browser cache and reload

### Google provider not showing up
- Double-check that Google is enabled in Firebase Console → Authentication → Sign-in method
- Make sure you set a support email address

## Development vs Production

**Development (localhost):**
- Domain: `localhost`
- Port doesn't matter (Firebase ignores it)

**Production:**
- Add your actual domain to authorized domains
- For Firebase Hosting: usually `yourproject.web.app` and `yourproject.firebaseapp.com`
- For custom domains: add your custom domain

## Need Help?

The authorized domains list is specifically for OAuth providers like Google. Email/password authentication works on any domain, but OAuth popup requires the domain to be explicitly allowed for security reasons.
