'use client'
import { useState, useEffect, useCallback } from 'react'
import { Users, ThumbsUp, Send, ChevronDown, ChevronUp, Code2, Loader2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SolutionUser { id: number; name: string }
interface Solution {
  id: number; language: string; code: string; title: string
  upvotes: number; createdAt: string; user: SolutionUser
}

const LANGS = ['javascript', 'python', 'java', 'cpp']
const LANG_LABEL: Record<string, string> = { javascript: 'JavaScript', python: 'Python', java: 'Java', cpp: 'C++' }

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function CommunitySolutions({ questionId, currentLang, currentCode }: {
  questionId: number
  currentLang: string
  currentCode: string
}) {
  const [solutions,  setSolutions]  = useState<Solution[]>([])
  const [locked,     setLocked]     = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState<number | null>(null)
  const [sharing,    setSharing]    = useState(false)
  const [shareTitle, setShareTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [upvoted,    setUpvoted]    = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch(`/api/problems/${questionId}/solutions`)
      .then(r => r.json())
      .then(d => {
        setLocked(d.locked)
        setSolutions(d.solutions ?? [])
      })
      .finally(() => setLoading(false))
  }, [questionId])

  async function share() {
    if (!currentCode.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/problems/${questionId}/solutions`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ language: currentLang, code: currentCode, title: shareTitle }),
    })
    const sol = await res.json()
    if (res.ok) {
      setSolutions(prev => [sol, ...prev.filter(s => s.user.id !== sol.user.id)])
      setSharing(false)
      setShareTitle('')
    }
    setSubmitting(false)
  }

  async function upvote(sol: Solution) {
    const wasUpvoted = upvoted.has(sol.id)
    setUpvoted(prev => {
      const next = new Set(prev)
      wasUpvoted ? next.delete(sol.id) : next.add(sol.id)
      return next
    })
    setSolutions(prev => prev.map(s =>
      s.id === sol.id ? { ...s, upvotes: s.upvotes + (wasUpvoted ? -1 : 1) } : s
    ))
    await fetch(`/api/problems/${questionId}/solutions/upvote`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ solutionId: sol.id, upvote: !wasUpvoted }),
    })
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-slate-300" /></div>

  if (locked) return (
    <div className="text-center py-12">
      <Lock size={36} className="mx-auto mb-3 text-slate-200" />
      <p className="text-sm font-semibold text-slate-700">Solutions are locked</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Solve this problem first to unlock community solutions and share your approach.</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users size={16} className="text-blue-500" /> Community Solutions
          {solutions.length > 0 && <span className="text-xs text-slate-400 font-normal">· {solutions.length}</span>}
        </h2>
        <button
          onClick={() => setSharing(s => !s)}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200"
        >
          <Code2 size={12} /> Share mine
        </button>
      </div>

      {/* Share form */}
      {sharing && (
        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4 animate-fadeIn">
          <p className="text-xs font-bold text-blue-700 mb-3">Share your solution</p>
          <input
            value={shareTitle}
            onChange={e => setShareTitle(e.target.value)}
            placeholder="Optional: describe your approach (e.g. Two Pointers O(n))"
            className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
          <div className="flex items-center gap-2 text-xs text-blue-600 mb-3">
            <span className="font-semibold capitalize">{LANG_LABEL[currentLang] ?? currentLang}</span>
            <span className="text-blue-300">·</span>
            <span>{currentCode.split('\n').length} lines</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={share}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Publish
            </button>
            <button onClick={() => setSharing(false)} className="text-xs text-blue-500 hover:text-blue-700 px-2">Cancel</button>
          </div>
        </div>
      )}

      {solutions.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Users size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm font-semibold">No shared solutions yet</p>
          <p className="text-xs mt-1">Be the first to share your approach!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solutions.map(sol => (
            <div key={sol.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {sol.user.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800">{sol.user.name}</span>
                  <span className="text-slate-300 mx-1.5">·</span>
                  <span className="text-xs text-slate-400 capitalize">{LANG_LABEL[sol.language] ?? sol.language}</span>
                  {sol.title && (
                    <>
                      <span className="text-slate-300 mx-1.5">·</span>
                      <span className="text-xs text-slate-600 font-medium">{sol.title}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => upvote(sol)}
                    className={cn(
                      'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all',
                      upvoted.has(sol.id)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    )}
                  >
                    <ThumbsUp size={11} /> {sol.upvotes > 0 ? sol.upvotes : ''}
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === sol.id ? null : sol.id)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {expanded === sol.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {expanded === sol.id && (
                <div className="border-t border-slate-100 animate-fadeIn">
                  <div className="px-4 py-1.5 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Code</span>
                    <span className="text-[10px] text-slate-400">{timeAgo(sol.createdAt)}</span>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 text-xs font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-80">
                    {sol.code}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
