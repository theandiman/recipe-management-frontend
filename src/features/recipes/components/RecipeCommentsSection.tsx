import React, { useEffect, useState, useCallback } from 'react'
import { getComments, createComment, type CommentsResponse, type CommentItem } from '../../../services/commentApi'
import { CommentInput } from './CommentInput'
import { CommentCard } from './CommentCard'

interface RecipeCommentsSectionProps {
  recipeId: string
  currentUserId?: string
}

const MessageIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

export const RecipeCommentsSection: React.FC<RecipeCommentsSectionProps> = ({
  recipeId,
  currentUserId,
}) => {
  const [data, setData] = useState<CommentsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getComments(recipeId, 0, 20)
      setData(res)
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoading(false)
    }
  }, [recipeId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleCreateComment = async (content: string) => {
    await createComment(recipeId, { content })
    fetchComments()
  }

  const handleReplyComment = async (parentId: string, content: string) => {
    await createComment(recipeId, { content, parentId })
    fetchComments()
  }

  const totalComments = data?.totalComments || 0

  return (
    <section className="mt-10 pt-8 border-t border-slate-800">
      <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
        <MessageIcon className="w-5 h-5 text-amber-400" />
        Discussion & Cooking Notes ({totalComments})
      </h2>

      {/* Main Comment Input */}
      {currentUserId ? (
        <div className="mb-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <CommentInput onSubmit={handleCreateComment} />
        </div>
      ) : (
        <div className="mb-8 p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-sm text-slate-400">
          Sign in to leave a comment or reply to this recipe!
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="text-sm text-slate-500 py-4">Loading discussion...</div>
      ) : !data?.comments || data.comments.length === 0 ? (
        <div className="text-sm text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-xl">
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div className="space-y-4">
          {data.comments.map((comment: CommentItem) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              recipeId={recipeId}
              currentUserId={currentUserId}
              onReply={handleReplyComment}
              onCommentChanged={fetchComments}
            />
          ))}
        </div>
      )}
    </section>
  )
}
