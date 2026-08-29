import React, { useState } from 'react'
import { updateComment, deleteComment, type CommentItem } from '../../../services/commentApi'
import { CommentInput } from './CommentInput'

interface CommentCardProps {
  comment: CommentItem
  recipeId: string
  currentUserId?: string
  currentUserInitial?: string
  onReply: (parentId: string, content: string) => Promise<void>
  onCommentChanged: () => void
}

const ReplyIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
)

const EditIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const TrashIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  currentUserId,
  currentUserInitial,
  onReply,
  onCommentChanged,
}) => {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const isOwner = currentUserId && currentUserId === comment.userId

  const handleUpdate = async () => {
    if (!editContent.trim()) return
    try {
      await updateComment(comment.id, { content: editContent.trim() })
      setIsEditing(false)
      onCommentChanged()
    } catch (err) {
      console.error('Failed to update comment:', err)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteComment(comment.id)
      onCommentChanged()
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  const authorInitial = (comment.authorName || 'C')[0].toUpperCase()

  return (
    <div className="group bg-white dark:bg-slate-900/60 border border-gray-200/80 dark:border-slate-800/80 rounded-2xl p-4 transition-all hover:border-gray-300 dark:hover:border-slate-700 shadow-xs">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs">
            {authorInitial}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {comment.authorName || 'Home Cook'}
            </div>
            <div className="text-[11px] text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {isOwner && !isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              title="Edit comment"
            >
              <EditIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Delete comment"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
            className="w-full bg-gray-50 dark:bg-slate-950 border border-emerald-500/50 rounded-xl p-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-3.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed my-2">
          {comment.content}
        </p>
      )}

      {/* Reply Button */}
      {currentUserId && !isReplying && (
        <button
          onClick={() => setIsReplying(true)}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors mt-2 cursor-pointer"
        >
          <ReplyIcon className="w-3.5 h-3.5" />
          Reply
        </button>
      )}

      {isReplying && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800/80">
          <CommentInput
            placeholder={`Reply to ${comment.authorName || 'cook'}...`}
            submitLabel="Reply"
            authorInitial={currentUserInitial}
            onCancel={() => setIsReplying(false)}
            onSubmit={async (text) => {
              await onReply(comment.id, text)
              setIsReplying(false)
            }}
          />
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 pl-4 sm:pl-6 border-l-2 border-emerald-500/20 space-y-3">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              recipeId={comment.recipeId}
              currentUserId={currentUserId}
              currentUserInitial={currentUserInitial}
              onReply={onReply}
              onCommentChanged={onCommentChanged}
            />
          ))}
        </div>
      )}
    </div>
  )
}
