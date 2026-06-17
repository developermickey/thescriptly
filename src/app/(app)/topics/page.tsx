import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Tag, CheckCircle, Lock } from 'lucide-react'

export const metadata: Metadata = { title: 'Topics' }

const TOPIC_META: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  'Arrays':             { emoji: '📦', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  'Strings':            { emoji: '🔤', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200' },
  'Linked Lists':       { emoji: '🔗', color: 'text-cyan-700',    bg: 'bg-cyan-50',    border: 'border-cyan-200' },
  'Trees':              { emoji: '🌳', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Graphs':             { emoji: '🕸️', color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  'Dynamic Programming':{ emoji: '⚡', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'Sorting':            { emoji: '📊', color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  'Binary Search':      { emoji: '🔍', color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  'Hash Tables':        { emoji: '🗂️', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  'Stacks':             { emoji: '📚', color: 'text-pink-700',    bg: 'bg-pink-50',    border: 'border-pink-200' },
  'Queues':             { emoji: '🚶', color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200' },
  'Recursion':          { emoji: '🔄', color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  'Backtracking':       { emoji: '↩️', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  'Greedy':             { emoji: '💰', color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  'Bit Manipulation':   { emoji: '🔧', color: 'text-slate-700',   bg: 'bg-slate-100',  border: 'border-slate-200' },
  'Math':               { emoji: '🔢', color: 'text-lime-700',    bg: 'bg-lime-50',    border: 'border-lime-200' },
}

const DEFAULT_META = { emoji: '💡', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' }

const DIFF_ORDER = ['Easy', 'Medium', 'Hard']

export default async function TopicsPage() {
  const session = await getServerSession(authOptions)
  const rawId   = parseInt((session?.user as any)?.id)
  const userId  = isNaN(rawId) ? -1 : rawId

  // Group problems by topic with difficulty breakdown
  const [problems, solvedRaw] = await Promise.all([
    prisma.practiceQuestion.findMany({
      select: { id: true, difficulty: true, topic: true },
    }),
    userId > 0
      ? prisma.submission.findMany({
          where:    { userId, status: 'accepted' },
          distinct: ['questionId'],
          select:   { questionId: true },
        })
      : Promise.resolve([]),
  ])

  const solvedSet = new Set(solvedRaw.map((s: any) => s.questionId))

  // Build topic map
  type TopicData = {
    total: number
    solved: number
    easy: number
    medium: number
    hard: number
  }
  const topicMap: Record<string, TopicData> = {}

  for (const p of problems) {
    const t = p.topic || 'Other'
    if (!topicMap[t]) topicMap[t] = { total: 0, solved: 0, easy: 0, medium: 0, hard: 0 }
    topicMap[t].total++
    if (solvedSet.has(p.id)) topicMap[t].solved++
    if (p.difficulty === 'Easy')   topicMap[t].easy++
    if (p.difficulty === 'Medium') topicMap[t].medium++
    if (p.difficulty === 'Hard')   topicMap[t].hard++
  }

  // Sort: known topics first (by TOPIC_META order), then alphabetically
  const knownOrder = Object.keys(TOPIC_META)
  const sorted = Object.entries(topicMap).sort(([a], [b]) => {
    const ai = knownOrder.indexOf(a)
    const bi = knownOrder.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b)
  })

  const totalProblems = problems.length
  const totalSolved   = solvedSet.size

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag size={20} className="text-blue-600" /> Topics
          </h1>
          <p className="text-slate-500 text-sm mt-1">Browse problems by topic. Focus on your weak areas.</p>
        </div>
        {userId > 0 && (
          <div className="text-right shrink-0">
            <div className="text-2xl font-black text-slate-900">{totalSolved}<span className="text-slate-300">/{totalProblems}</span></div>
            <div className="text-xs text-slate-500">problems solved</div>
          </div>
        )}
      </div>

      {/* Topic grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(([topic, data]) => {
          const meta = TOPIC_META[topic] ?? DEFAULT_META
          const pct  = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0
          const done = data.solved === data.total && data.total > 0

          return (
            <Link
              key={topic}
              href={`/problems?topic=${encodeURIComponent(topic)}`}
              className={`group block bg-white border ${meta.border} rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.emoji}</span>
                  <div>
                    <h3 className={`font-bold text-sm ${meta.color} group-hover:underline`}>{topic}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{data.total} problems</p>
                  </div>
                </div>
                {done ? (
                  <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : userId < 0 ? (
                  <Lock size={14} className="text-slate-300 shrink-0 mt-0.5" />
                ) : null}
              </div>

              {/* Difficulty pills */}
              <div className="flex gap-1.5 mb-3">
                {data.easy > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">{data.easy}E</span>
                )}
                {data.medium > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">{data.medium}M</span>
                )}
                {data.hard > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">{data.hard}H</span>
                )}
              </div>

              {/* Progress bar */}
              {userId > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>{data.solved}/{data.total} solved</span>
                    <span className={`font-bold ${pct === 100 ? 'text-emerald-600' : meta.color}`}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
