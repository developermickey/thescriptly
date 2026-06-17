'use client'
import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, ThumbsUp, Reply, Send, ChevronDown, ChevronUp } from 'lucide-react'

interface CommentUser { id: number; name: string; avatar: string | null }
interface CommentLike { userId: number }
interface ReplyData {
  id: number; body: string; likes: number; createdAt: string; parentId: number
  user: CommentUser; likedBy: CommentLike[]
}
interface CommentData extends ReplyData {
  replies: ReplyData[]
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']
  const color  = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white font-bold shrink-0`}
         style={{ fontSize: size * 1.5 + 'px', width: size * 4 + 'px', height: size * 4 + 'px' }}>
      {name[0].toUpperCase()}
    </div>
  )
}

interface CommentRowProps {
  comment: CommentData | ReplyData
  userId: number | null
  questionId: number
  onReplyPosted?: (reply: ReplyData) => void
  isReply?: boolean
}

function CommentRow({ comment, userId, questionId, onReplyPosted, isReply = false }: CommentRowProps) {
  const [likes,       setLikes]       = useState(comment.likes)
  const [liked,       setLiked]       = useState(comment.likedBy.some(l => l.userId === userId))
  const [showReply,   setShowReply]   = useState(false)
  const [replyBody,   setReplyBody]   = useState('')
  const [posting,     setPosting]     = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const replies = (comment as CommentData).replies ?? []

  async function toggleLike() {
    if (!userId) return
    const prev = liked
    setLiked(!prev)
    setLikes(l => prev ? l - 1 : l + 1)
    await fetch(`/api/problems/${questionId}/comments/${comment.id}/like`, { method: 'POST' })
  }

  async function postReply() {
    if (!replyBody.trim() || posting) return
    setPosting(true)
    const res  = await fetch(`/api/problems/${questionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyBody.trim(), parentId: comment.id }),
    })
    if (res.ok) {
      const reply = await res.json()
      onReplyPosted?.(reply)
      setReplyBody('')
      setShowReply(false)
    }
    setPosting(false)
  }

  return (
    <div className={`${isReply ? 'ml-10 mt-3' : ''}`}>
      <div className="flex gap-3">
        <Avatar name={comment.user.name} size={8} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800">{comment.user.name}</span>
            <span className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                liked ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'
              }`}
            >
              <ThumbsUp size={12} /> {likes > 0 && likes}
            </button>
            {!isReply && userId && (
              <button
                onClick={() => setShowReply(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors"
              >
                <Reply size={12} /> Reply
              </button>
            )}
            {!isReply && replies.length > 0 && (
              <button
                onClick={() => setShowReplies(v => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {showReply && (
            <div className="mt-3 flex gap-2">
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Write a reply…"
                rows={2}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={postReply}
                disabled={posting || !replyBody.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors self-end"
              >
                <Send size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isReply && showReplies && replies.length > 0 && (
        <div className="border-l-2 border-slate-100 pl-3 mt-2 space-y-3">
          {replies.map(r => (
            <CommentRow key={r.id} comment={r as any} userId={userId} questionId={questionId} isReply />
          ))}
        </div>
      )}
    </div>
  )
}

export function ProblemDiscussions({ questionId, userId }: { questionId: number; userId: number | null }) {
  const [comments, setComments] = useState<CommentData[]>([])
  const [body,     setBody]     = useState('')
  const [posting,  setPosting]  = useState(false)
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/problems/${questionId}/comments`)
    if (res.ok) setComments(await res.json())
    setLoading(false)
  }, [questionId])

  useEffect(() => { load() }, [load])

  async function postComment() {
    if (!body.trim() || posting) return
    setPosting(true)
    const res = await fetch(`/api/problems/${questionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments(prev => [c, ...prev])
      setBody('')
    }
    setPosting(false)
  }

  function onReplyPosted(commentId: number, reply: ReplyData) {
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
    ))
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-5">
        <MessageCircle size={17} /> Discussion
        <span className="text-sm font-normal text-slate-400">({comments.length})</span>
      </h3>

      {userId ? (
        <div className="mb-6 flex gap-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Ask a question or share your approach…"
            rows={3}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
          />
          <button
            onClick={postComment}
            disabled={posting || !body.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors self-end flex items-center gap-2"
          >
            <Send size={14} /> Post
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-400 mb-5">Sign in to join the discussion.</p>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-32" />
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No discussion yet. Be the first to ask a question!</p>
      ) : (
        <div className="space-y-6">
          {comments.map(c => (
            <CommentRow
              key={c.id}
              comment={c}
              userId={userId}
              questionId={questionId}
              onReplyPosted={reply => onReplyPosted(c.id, reply)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
