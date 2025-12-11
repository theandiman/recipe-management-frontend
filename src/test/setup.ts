import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Mock Firebase to prevent initialization errors in CI/CD
vi.mock('../config/firebase', () => ({
  auth: {},
  storage: {},
  db: {}
}))

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn()
}))

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn()
}))

// Mock Framer Motion to prevent animations from interfering with tests
vi.mock('framer-motion', () => {
  const omitMotionProps = (props: any) => {
    // Remove common framer-motion props that should not be forwarded to DOM elements
    const {
      initial, animate, exit, variants,
      whileHover, whileTap, whileFocus, whileDrag,
      transition, layout, layoutId,
      onHoverStart, onHoverEnd, onDragStart, onDragEnd, onDrag, onAnimationComplete,
      onUpdate, onViewportBoxUpdate, style, ...rest
    } = props
    return rest
  }

  const makeMock = (el: string) => ({ children, ...props }: any) => React.createElement(el, omitMotionProps(props), children)

  return {
    motion: {
      div: makeMock('div'),
      button: makeMock('button'),
      svg: makeMock('svg'),
      path: makeMock('path'),
      h3: makeMock('h3'),
      p: makeMock('p'),
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  }
})
