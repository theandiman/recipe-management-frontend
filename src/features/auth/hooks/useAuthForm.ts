import { useState, useCallback, useMemo } from 'react'

interface UseAuthFormOptions<T> {
  initialValues: T
  onSubmit: (values: T) => Promise<void>
  validate: (values: T) => Partial<T>
}

export function useAuthForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate
}: UseAuthFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<T>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field
    if (errors[name as keyof T]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validate(values)
    setErrors(validationErrors)
    
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [values, validate, onSubmit])

  return useMemo(() => ({
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit
  }), [values, errors, isSubmitting, handleChange, handleSubmit])
}
