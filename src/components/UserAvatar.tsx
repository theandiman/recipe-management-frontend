import React, { useState, useEffect } from 'react'

export interface UserAvatarProps {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
  'data-testid'?: string
}

const SIZE_CLASSES: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-10 h-10 text-sm font-semibold',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-3xl font-bold',
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  alt,
  'data-testid': testId,
}) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [src])

  const initial = (name?.trim()?.[0] || 'U').toUpperCase()
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={alt || name || 'User avatar'}
        onError={() => setHasError(true)}
        className={`rounded-full object-cover shrink-0 ${sizeClass} ${className}`}
        data-testid={testId}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-emerald-600 to-teal-500 shadow-sm shrink-0 select-none ${sizeClass} ${className}`}
      data-testid={testId}
      aria-label={alt || name || 'User avatar'}
    >
      <span>{initial}</span>
    </div>
  )
}
