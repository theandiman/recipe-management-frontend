import React, { useState } from 'react'
import { updateComment, deleteComment, type CommentItem } from '../../../services/commentApi'
import { CommentInput } from './CommentInput'

interface CommentCardProps {
  comment: CommentItem
  recipeId: string
  currentUserId?: string
  onReply: (parentId: string, content: string) => Promise<void>
  onCommentChanged: () => void
}

const ReplyIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
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

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center font-bold text-slate-950 text-xs">
            {comment.authorName ? comment.authorName[0].toUpperCase() : 'C'}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">
              {comment.authorName || 'Chef User'}
            </div>
            <div className="text-[10px] text-slate-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {isOwner && !isEditing && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
              title="Edit comment"
            >
              <EditIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
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
            className="w-full bg-slate-950 border border-amber-500/50 rounded-lg p-2 text-sm text-slate-100 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-semibold rounded-md"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-300 leading-relaxed my-2">{comment.content}</p>
      )}

      {/* Reply Action */}
      {currentUserId && !isReplying && (
        <button
          onClick={() => setIsReplying(true)}
          className="flex items-center gap-1 text-xs text-amber-400/80 hover:text-amber-400 transition-colors mt-2"
        >
          <ReplyIcon className="w-3 h-3" />
          Reply
        </button>
      )}

      {isReplying && (
        <div className="mt-3 pl-4 border-l-2 border-amber-500/30">
          <CommentInput
            placeholder={`Reply to ${comment.authorName || 'Chef'}...`}
            submitLabel="Reply"
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
        <div className="mt-4 pl-4 border-l-2 border-slate-800 space-y-3">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              recipeId={comment.recipeId}
              currentUserId={currentUserId}
              onReply={onReply}
              onCommentChanged={onCommentChanged}
            />
          ))}
        </div>
      )}
    </div>
  )
}
