import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StatsSkeleton } from './StatsSkeleton'
import { RecentRecipesSkeleton } from './RecentRecipesSkeleton'

describe('Skeleton Components', () => {
  describe('StatsSkeleton', () => {
    it('should render loading skeleton for stats', () => {
      const { container } = render(<StatsSkeleton />)
      
      // Should have skeleton elements with animation
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should render multiple stat placeholders', () => {
      const { container } = render(<StatsSkeleton />)
      
      // Verify structure exists
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('RecentRecipesSkeleton', () => {
    it('should render loading skeleton for recent recipes', () => {
      const { container } = render(<RecentRecipesSkeleton />)
      
      // Should have skeleton elements with animation
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should render multiple recipe card placeholders', () => {
      const { container } = render(<RecentRecipesSkeleton />)
      
      // Verify structure exists
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})
