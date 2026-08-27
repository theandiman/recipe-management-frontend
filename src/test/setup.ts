import '@testing-library/jest-dom'
import React from 'react'
import { vi, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '../mocks/server'

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))

// Reset any request handlers that we may add during the tests, so they don't affect other tests.
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished.
afterAll(() => server.close())

// Mock window.matchMedia (not implemented by jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

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

// Mock sonner to prevent toast rendering issues in jsdom
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  Toaster: () => null,
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
      h1: makeMock('h1'),
      h2: makeMock('h2'),
      h3: makeMock('h3'),
      p: makeMock('p'),
      ul: makeMock('ul'),
      li: makeMock('li'),
      img: makeMock('img'),
      span: makeMock('span'),
      aside: makeMock('aside'),
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  }
})
