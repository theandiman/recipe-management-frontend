import React, { useState } from 'react'

interface CommentInputProps {
  placeholder?: string
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

const SendIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

export const CommentInput: React.FC<CommentInputProps> = ({
  placeholder = 'Add a comment or cooking question...',
  onSubmit,
  onCancel,
  submitLabel = 'Post Comment',
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
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={2000}
        rows={2}
        placeholder={placeholder}
        className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{content.length} / 2000</span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            <SendIcon className="w-3.5 h-3.5" />
            {isSubmitting ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}
