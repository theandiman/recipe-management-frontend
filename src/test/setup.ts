import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

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
