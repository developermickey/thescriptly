'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, CheckCircle, ChevronRight, Building2, Tag } from 'lucide-react'

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  Hard:   'text-red-500 bg-red-50 border-red-200',
}

interface Problem {
  id: number
  title: string
  difficulty: string
  topic: string | null
  company: string | null
}

export function DailyChallenge() {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [solved,  setSolved]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/daily')
      .then(r => r.json())
      .then(d => {
        setProblem(d.problem)
        setSolved(d.solved)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
        <div className="h-5 bg-slate-100 rounded w-2/3 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-1/4" />
      </div>
    )
  }

  if (!problem) return null

  return (
    <div className={`rounded-xl border p-5 transition-all ${
      solved
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-gradient-to-br from-blue-600 to-violet-600 border-transparent text-white'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
          solved ? 'text-emerald-700' : 'text-white/80'
        }`}>
          <Zap size={12} />
          Daily Challenge
        </div>
        {solved && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle size={11} /> Solved today!
          </span>
        )}
      </div>

      <h3 className={`text-base font-bold mb-3 leading-snug ${solved ? 'text-slate-900' : 'text-white'}`}>
        {problem.title}
      </h3>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
          solved ? DIFF_COLOR[problem.difficulty] : 'bg-white/20 text-white border-white/30'
        }`}>
          {problem.difficulty}
        </span>
        {problem.topic && (
          <span className={`text-xs flex items-center gap-1 ${solved ? 'text-slate-500' : 'text-white/70'}`}>
            <Tag size={10} /> {problem.topic}
          </span>
        )}
        {problem.company && (
          <span className={`text-xs flex items-center gap-1 ${solved ? 'text-slate-500' : 'text-white/70'}`}>
            <Building2 size={10} /> {problem.company}
          </span>
        )}
      </div>

      <Link
        href={`/problems/${problem.id}`}
        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
          solved
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-white text-blue-700 hover:bg-blue-50'
        }`}
      >
        {solved ? 'Review Solution' : 'Solve Now'}
        <ChevronRight size={14} />
      </Link>
    </div>
  )
}
