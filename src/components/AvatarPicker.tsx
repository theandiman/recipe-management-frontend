import { useId, useState, type ChangeEvent } from 'react'

interface AvatarPickerProps {
  displayName: string
  avatarUrl?: string
  disabled?: boolean
  onSelect: (file: File) => void | Promise<void>
  onRemove: () => void | Promise<void>
}

export function AvatarPicker({
  displayName,
  avatarUrl,
  disabled = false,
  onSelect,
  onRemove,
}: AvatarPickerProps) {
  const inputId = useId()
  const initial = (displayName.trim()[0] || '?').toUpperCase()
  const [actionError, setActionError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    if (!file) {
      return
    }

    setActionError(null)
    setIsProcessing(true)
    try {
      await onSelect(file)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update the profile picture.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemove = async () => {
    setActionError(null)
    setIsProcessing(true)
    try {
      await onRemove()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to remove the profile picture.')
    } finally {
      setIsProcessing(false)
    }
  }

  const isDisabled = disabled || isProcessing

  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-20 w-20 rounded-full object-cover"
        />
      ) : (
        <div
          aria-label={`${displayName} avatar placeholder`}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-3xl font-bold text-white"
        >
          {initial}
        </div>
      )}
      <div className="flex flex-col items-start gap-2">
        <label
          className="cursor-pointer rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          htmlFor={inputId}
        >
          Choose profile picture
          <input
            accept="image/jpeg,image/png,image/webp"
            aria-label="Choose profile picture"
            className="sr-only"
            disabled={isDisabled}
            id={inputId}
            onChange={handleSelect}
            type="file"
          />
        </label>
        {avatarUrl && (
          <button
            className="rounded-md px-1 text-sm font-medium text-red-700 underline hover:text-red-800 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isDisabled}
            onClick={() => void handleRemove()}
            type="button"
          >
            Remove profile picture
          </button>
        )}
        {actionError && (
          <p className="text-sm text-red-700" role="alert">
            {actionError}
          </p>
        )}
      </div>
    </div>
  )
}
