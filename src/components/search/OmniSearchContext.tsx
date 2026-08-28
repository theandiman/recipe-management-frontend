import React, { createContext, useContext, useState, useEffect } from 'react'
import { OmniSearchModal } from './OmniSearchModal'

interface OmniSearchContextType {
  isOpen: boolean
  openOmniSearch: (initialQuery?: string) => void
  closeOmniSearch: () => void
}

const OmniSearchContext = createContext<OmniSearchContextType | undefined>(undefined)

export const OmniSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')

  const openOmniSearch = (query: string = '') => {
    if (query) setInitialQuery(query)
    setIsOpen(true)
  }

  const closeOmniSearch = () => {
    setIsOpen(false)
    setInitialQuery('')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <OmniSearchContext.Provider value={{ isOpen, openOmniSearch, closeOmniSearch }}>
      {children}
      <OmniSearchModal isOpen={isOpen} onClose={closeOmniSearch} initialQuery={initialQuery} />
    </OmniSearchContext.Provider>
  )
}

export const useOmniSearch = () => {
  const ctx = useContext(OmniSearchContext)
  if (!ctx) {
    return {
      isOpen: false,
      openOmniSearch: () => {},
      closeOmniSearch: () => {},
    }
  }
  return ctx
}
