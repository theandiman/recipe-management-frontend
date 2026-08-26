import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Firebase configuration from environment variables
// Create a .env file with these variables for local development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForTestMode123456789',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-app',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:1234567890'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Firebase Storage
export const storage = getStorage(app)
