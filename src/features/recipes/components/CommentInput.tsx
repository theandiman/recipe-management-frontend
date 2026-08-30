import React, { useState } from 'react'

interface CommentInputProps {
  placeholder?: string
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  authorAvatarUrl?: string
  authorInitial?: string
}

const SendIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

export const CommentInput: React.FC<CommentInputProps> = ({
  placeholder = 'Add a comment or cooking question...',
  onSubmit,
  onCancel,
  submitLabel = 'Post Comment',
  authorAvatarUrl,
  authorInitial = 'C',
}) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } catch (err) {
      console.error('Failed to submit comment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs mt-0.5">
        {authorAvatarUrl ? (
          <img src={authorAvatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          authorInitial.toUpperCase()
        )}
      </div>

      <div className="flex-1 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={2}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-3.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none shadow-xs"
        />
        {content.trim() && (
          <div className="flex items-center justify-between animate-in fade-in duration-150">
            <span className="text-xs text-gray-400">{content.length} / 2000</span>
            <div className="flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <SendIcon className="w-3.5 h-3.5" />
                {isSubmitting ? 'Posting...' : submitLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
