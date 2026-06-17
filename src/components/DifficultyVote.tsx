'use client'
import { useEffect, useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteCounts { Easy: number; Medium: number; Hard: number }

const OPTS: { label: string; color: string; active: string }[] = [
  { label: 'Easy',   color: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50', active: 'bg-emerald-500 text-white border-emerald-500' },
  { label: 'Medium', color: 'border-amber-200   text-amber-600   hover:bg-amber-50',   active: 'bg-amber-500   text-white border-amber-500' },
  { label: 'Hard',   color: 'border-red-200     text-red-500     hover:bg-red-50',     active: 'bg-red-500     text-white border-red-500' },
]

export function DifficultyVote({ questionId }: { questionId: number }) {
  const [counts,  setCounts]  = useState<VoteCounts>({ Easy: 0, Medium: 0, Hard: 0 })
  const [myVote,  setMyVote]  = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting,  setVoting]  = useState(false)

  useEffect(() => {
    fetch(`/api/problems/${questionId}/difficulty-vote`)
      .then(r => r.json())
      .then(d => { setCounts(d.counts); setMyVote(d.myVote) })
      .finally(() => setLoading(false))
  }, [questionId])

  async function vote(v: string) {
    if (voting) return
    setVoting(true)
    const res  = await fetch(`/api/problems/${questionId}/difficulty-vote`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ vote: v }),
    })
    const data = await res.json()
    if (res.ok) { setCounts(data.counts); setMyVote(data.myVote) }
    setVoting(false)
  }

  const total = counts.Easy + counts.Medium + counts.Hard

  if (loading) return null

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <ThumbsUp size={11} /> Community Difficulty
        {total > 0 && <span className="font-normal text-slate-300">· {total} vote{total !== 1 ? 's' : ''}</span>}
      </p>

      <div className="flex items-center gap-2">
        {OPTS.map(opt => {
          const count = counts[opt.label as keyof VoteCounts]
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0
          const isMe  = myVote === opt.label
          return (
            <button
              key={opt.label}
              onClick={() => vote(opt.label)}
              disabled={voting}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-60',
                isMe ? opt.active : opt.color
              )}
            >
              <span>{opt.label}</span>
              <span className={cn('text-[10px] font-bold', isMe ? 'opacity-80' : 'opacity-60')}>
                {pct}%{count > 0 ? ` (${count})` : ''}
              </span>
            </button>
          )
        })}
      </div>

      {myVote && (
        <p className="text-[10px] text-slate-400 text-center mt-2">
          You voted <strong>{myVote}</strong> · click to change
        </p>
      )}
    </div>
  )
}
