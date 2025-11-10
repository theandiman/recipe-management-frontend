# Firebase Setup Guide

## Prerequisites

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password sign-in method
3. Install Firebase CLI: `npm install -g firebase-tools`

## Local Development Setup

### 1. Get Firebase Configuration

1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. Click "Add app" → Web (</>) icon
4. Register your app and copy the configuration

### 2. Configure Environment Variables

Create a `.env` file in the project root (use `.env.example` as template):

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Enable Authentication

1. Go to Firebase Console → Authentication
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. (Optional) Enable "Email link (passwordless sign-in)"

## Deployment

### 1. Login to Firebase

```bash
firebase login
```

### 2. Initialize Firebase (first time only)

```bash
firebase init hosting
```

- Select your Firebase project
- Set public directory to: `dist`
- Configure as single-page app: `Yes`
- Don't overwrite index.html: `No`

### 3. Build and Deploy

```bash
npm run build
firebase deploy
```

## Additional Firebase Features

### Add Firestore Database

1. Enable Firestore in Firebase Console
2. Install: `npm install firebase/firestore`
3. Set up security rules

### Add Storage

1. Enable Storage in Firebase Console
2. Set up security rules for file uploads

### Security Rules Example

For Firestore (`firestore.rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Recipes - authenticated users can read all, but only modify their own
    match /recipes/{recipeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              resource.data.userId == request.auth.uid;
    }
  }
}
```

## Testing Authentication

1. Run dev server: `npm run dev`
2. Navigate to `/register` and create an account
3. Check Firebase Console → Authentication to see the new user
4. Try logging in with the created account

## Troubleshooting

### CORS Errors
- Make sure your Firebase project's authorized domains include `localhost` for development
- Add your production domain in Firebase Console → Authentication → Settings → Authorized domains

### Environment Variables Not Loading
- Restart dev server after changing `.env` file
- Ensure `.env` is in project root, not in `src/`
- Variables must start with `VITE_` prefix

### Firebase Not Initialized
- Check that all required environment variables are set
- Verify Firebase configuration in `src/config/firebase.ts`
