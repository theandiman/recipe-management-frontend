import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Mock Framer Motion to prevent animations from interfering with tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    button: ({ children, ...props }: any) => React.createElement('button', props, children),
    svg: ({ children, ...props }: any) => React.createElement('svg', props, children),
    path: ({ children, ...props }: any) => React.createElement('path', props, children),
    h3: ({ children, ...props }: any) => React.createElement('h3', props, children),
    p: ({ children, ...props }: any) => React.createElement('p', props, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}))
