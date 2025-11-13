# GitHub Secrets Setup for Deployment

## Problem
The deployed site shows `Firebase: Error (auth/invalid-api-key)` because environment variables aren't available during the build process.

## Solution
Add Firebase configuration as GitHub repository secrets so they're available when GitHub Actions builds the app.

## Steps to Add Secrets

1. **Go to your GitHub repository settings:**
   ```
   https://github.com/theandiman/recipe-management-frontend/settings/secrets/actions
   ```

2. **Click "New repository secret"** and add each of these secrets:

### Required Secrets

Get the values from your `.env.local` file and add them as secrets:

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `.env.local` or Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `.env.local` (usually `{project-id}.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `.env.local` or Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `.env.local` (usually `{project-id}.appspot.com`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `.env.local` or Firebase Console |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `.env.local` or Firebase Console |
| `VITE_API_URL` | Backend AI service URL | `.env.local` (Cloud Run URL) |
| `VITE_STORAGE_API_URL` | Storage service URL | `.env.local` (Cloud Run URL) |

### Already Configured

These secrets should already exist (used by deployment workflow):
- ✅ `FIREBASE_SERVICE_ACCOUNT_DEV`
- ✅ `FIREBASE_PROJECT_ID_DEV`
- ✅ `GITHUB_TOKEN` (automatically provided by GitHub)

## Quick Copy from .env.local

To see your current values:
```bash
cat .env.local
```

## Verification

After adding the secrets:

1. **Trigger a new deployment:**
   ```bash
   git commit --allow-empty -m "Trigger deployment with environment variables"
   git push origin main
   ```

2. **Check the build logs** in GitHub Actions to verify environment variables are being used

3. **Visit your deployed site** - Firebase errors should be gone!

## Security Note

⚠️ **Never commit `.env.local` or `.env` files to Git**

These files contain sensitive credentials. They're already in `.gitignore` to prevent accidental commits.

## How It Works

1. **Local development:** Uses `.env.local` (gitignored)
2. **GitHub Actions build:** Uses GitHub secrets 
3. **Vite build process:** Replaces `import.meta.env.VITE_*` with actual values at build time
4. **Deployed site:** Has environment variables baked into the compiled JavaScript

## Troubleshooting

**If you still see Firebase errors after adding secrets:**

1. Check that secret names match exactly (case-sensitive)
2. Verify secrets have values (not empty)
3. Re-run the deployment workflow
4. Check GitHub Actions logs for any error messages

**To get Firebase config values:**

Visit Firebase Console → Project Settings → Your apps → Web app → Config:
https://console.firebase.google.com/project/{your-project-id}/settings/general
