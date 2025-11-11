import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser
} from 'firebase/auth'
import { auth } from '../../config/firebase'
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors'
import type { AuthContextType, LoginCredentials, RegisterData, User } from '../../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Convert Firebase User to our User type
 */
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(convertFirebaseUser(firebaseUser))
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )
      setUser(convertFirebaseUser(userCredential.user))
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      setUser(convertFirebaseUser(userCredential.user))
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      )
      
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: data.name
      })
      
      // Update local state with the display name
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: data.name,
        photoURL: null,
      })
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err)
      setError(errorMessage)
      console.error('Logout error:', errorMessage)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
