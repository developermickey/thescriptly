'use client'
import { useState, useEffect } from 'react'
import { MessageSquare, Send, CornerDownRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface Comment {
  id: number; body: string; createdAt: string
  user: { id: number; name: string }
  replies: Comment[]
}

export function LessonDiscussion({ lessonId }: { lessonId: number }) {
  const [open, setOpen]           = useState(false)
  const [comments, setComments]   = useState<Comment[]>([])
  const [loading, setLoading]     = useState(false)
  const [newBody, setNewBody]     = useState('')
  const [replyTo, setReplyTo]     = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/lessons/${lessonId}/discussion`)
    setComments(await res.json())
    setLoading(false)
  }

  useEffect(() => { if (open) load() }, [open])

  async function post(body: string, parentId: number | null = null) {
    if (!body.trim()) return
    setSubmitting(true)
    await fetch(`/api/lessons/${lessonId}/discussion`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, parentId }),
    })
    setNewBody(''); setReplyText(''); setReplyTo(null)
    await load()
    setSubmitting(false)
  }

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
      >
        <MessageSquare size={15} />
        Lesson Discussion
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="mt-4 animate-fadeIn">
          {/* New comment box */}
          <div className="mb-5">
            <textarea
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              placeholder="Ask a question or share a note about this lesson…"
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => post(newBody)}
                disabled={!newBody.trim() || submitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Post
              </button>
            </div>
          </div>

          {/* Comments list */}
          {loading
            ? <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-slate-400" /></div>
            : comments.length === 0
              ? <p className="text-sm text-slate-400 text-center py-6">No comments yet. Start the discussion!</p>
              : (
                <div className="space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className="border border-slate-100 rounded-xl overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {c.user.name[0]?.toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{c.user.name}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                        <button
                          onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                          className="mt-2 text-xs text-slate-400 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors"
                        >
                          <CornerDownRight size={11} /> Reply
                        </button>

                        {replyTo === c.id && (
                          <div className="mt-3 pl-4 border-l-2 border-blue-200">
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Write a reply…"
                              rows={2}
                              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => post(replyText, c.id)}
                                disabled={!replyText.trim() || submitting}
                                className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                <Send size={11} /> Reply
                              </button>
                              <button onClick={() => { setReplyTo(null); setReplyText('') }} className="text-xs text-slate-400 hover:text-slate-600 px-2">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {c.replies.length > 0 && (
                        <div className="border-t border-slate-50 bg-slate-50 divide-y divide-slate-100">
                          {c.replies.map(r => (
                            <div key={r.id} className="px-4 py-3 pl-8">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {r.user.name[0]?.toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{r.user.name}</span>
                                <span className="text-xs text-slate-400">
                                  {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{r.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
        </div>
      )}
    </div>
  )
}
