'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, CheckCircle, Circle, X, Filter, ChevronDown, Bookmark } from 'lucide-react'
import { cn, getDifficultyColor } from '@/lib/utils'

interface Question {
  id: number
  title: string
  difficulty: string
  topic: string | null
  company: string | null
  acceptanceRate: number | null
}

interface Props {
  questions:          Question[]
  solvedIds:          number[]
  bookmarkedIds?:     number[]
  initialTopic?:      string
  initialCompany?:    string
  initialDifficulty?: string
  initialSearch?:     string
}

const DIFFICULTIES = ['all', 'Easy', 'Medium', 'Hard']
const STATUS_OPTS   = ['all', 'solved', 'unsolved']

export function ProblemsClient({ questions, solvedIds, bookmarkedIds = [], initialTopic = 'all', initialCompany = 'all', initialDifficulty = 'all', initialSearch = '' }: Props) {
  const solved      = new Set(solvedIds)
  const bookmarked  = new Set(bookmarkedIds)
  const topics    = useMemo(() => ['all', ...new Set(questions.map(q => q.topic).filter(Boolean))] as string[], [questions])
  const companies = useMemo(() => ['all', ...new Set(questions.map(q => q.company).filter(Boolean))].sort() as string[], [questions])

  const [search,       setSearch]       = useState(initialSearch)
  const [difficulty,   setDifficulty]   = useState(initialDifficulty)
  const [topic,        setTopic]        = useState(initialTopic)
  const [company,      setCompany]      = useState(initialCompany)
  const [status,       setStatus]       = useState('all')
  const [onlyBookmark, setOnlyBookmark] = useState(false)
  // If URL param filters are set, default to list view so the filter is visible
  const [view,       setView]       = useState<'topic' | 'list'>(initialTopic !== 'all' || initialCompany !== 'all' ? 'list' : 'topic')

  const filtered = useMemo(() => {
    return questions.filter(q => {
      const matchSearch   = !search || q.title.toLowerCase().includes(search.toLowerCase()) || (q.company || '').toLowerCase().includes(search.toLowerCase())
      const matchDiff     = difficulty === 'all' || q.difficulty === difficulty
      const matchTopic    = topic === 'all' || q.topic === topic
      const matchCompany  = company === 'all' || q.company === company
      const matchStatus   = status === 'all' || (status === 'solved' ? solved.has(q.id) : !solved.has(q.id))
      const matchBookmark = !onlyBookmark || bookmarked.has(q.id)
      return matchSearch && matchDiff && matchTopic && matchCompany && matchStatus && matchBookmark
    })
  }, [questions, search, difficulty, topic, company, status, onlyBookmark, solved, bookmarked])

  const totalSolved = solved.size
  const easyCnt  = questions.filter(q => q.difficulty === 'Easy').length
  const medCnt   = questions.filter(q => q.difficulty === 'Medium').length
  const hardCnt  = questions.filter(q => q.difficulty === 'Hard').length
  const pct      = questions.length > 0 ? Math.round(totalSolved / questions.length * 100) : 0

  const hasFilters = search || difficulty !== 'all' || topic !== 'all' || company !== 'all' || status !== 'all' || onlyBookmark

  function clearAll() {
    setSearch(''); setDifficulty('all'); setTopic('all'); setCompany('all'); setStatus('all'); setOnlyBookmark(false)
  }

  // Group by topic for topic view
  const byTopic = useMemo(() => {
    const map: Record<string, Question[]> = {}
    filtered.forEach(q => {
      const t = q.topic || 'Other'
      if (!map[t]) map[t] = []
      map[t].push(q)
    })
    return map
  }, [filtered])

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Practice Problems</h1>
        <p className="text-slate-500 mt-1 text-sm">{questions.length} curated problems across DSA and web dev</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',   value: questions.length, sub: `${pct}% solved`, color: 'text-slate-900',    bg: 'bg-white',         bar: null },
          { label: 'Easy',    value: easyCnt,           sub: `${Math.round(easyCnt/questions.length*100)}%`, color: 'text-emerald-600', bg: 'bg-emerald-50',  bar: 'bg-emerald-500' },
          { label: 'Medium',  value: medCnt,            sub: `${Math.round(medCnt/questions.length*100)}%`,  color: 'text-amber-600',   bg: 'bg-amber-50',    bar: 'bg-amber-500' },
          { label: 'Hard',    value: hardCnt,           sub: `${Math.round(hardCnt/questions.length*100)}%`, color: 'text-red-600',     bg: 'bg-red-50',      bar: 'bg-red-500' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-slate-200 rounded-xl px-4 py-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
          <span className="text-sm font-bold text-blue-600">{totalSolved} / {questions.length} solved</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">Keep going! 💪</span>
          <span className="text-xs font-bold text-slate-500">{pct}%</span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search problems or companies…"
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-slate-400 shrink-0" />

          {/* Difficulty */}
          <div className="flex items-center gap-1">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize',
                  difficulty === d
                    ? d === 'all' ? 'bg-slate-800 text-white border-slate-800'
                      : d === 'Easy' ? 'bg-emerald-500 text-white border-emerald-500'
                      : d === 'Medium' ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >{d}</button>
            ))}
          </div>

          <div className="w-px h-4 bg-slate-200" />

          {/* Status */}
          <div className="flex items-center gap-1">
            {STATUS_OPTS.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize',
                  status === s
                    ? s === 'solved' ? 'bg-emerald-500 text-white border-emerald-500'
                      : s === 'unsolved' ? 'bg-slate-700 text-white border-slate-700'
                      : 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                )}
              >{s}</button>
            ))}
          </div>

          <div className="w-px h-4 bg-slate-200" />

          {/* Bookmarked */}
          {bookmarkedIds.length > 0 && (
            <button
              onClick={() => setOnlyBookmark(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                onlyBookmark
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
              )}
            >
              <Bookmark size={11} fill={onlyBookmark ? 'currentColor' : 'none'} />
              Bookmarked ({bookmarkedIds.length})
            </button>
          )}

          <div className="w-px h-4 bg-slate-200" />

          {/* Topic dropdown */}
          <div className="relative">
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1 text-xs font-semibold border border-slate-200 rounded-full bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:border-slate-300 transition-all"
            >
              {topics.map(t => <option key={t} value={t}>{t === 'all' ? 'All Topics' : t}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Company dropdown */}
          {companies.length > 1 && (
            <div className="relative">
              <select
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1 text-xs font-semibold border border-slate-200 rounded-full bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:border-slate-300 transition-all"
              >
                {companies.map(c => <option key={c} value={c}>{c === 'all' ? 'All Companies' : c}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Clear */}
          {hasFilters && (
            <button onClick={clearAll} className="ml-auto text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors">
              <X size={12} /> Clear all
            </button>
          )}

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('topic')} className={cn('px-2.5 py-1 rounded-md text-xs font-semibold transition-all', view === 'topic' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500')}>By Topic</button>
            <button onClick={() => setView('list')}  className={cn('px-2.5 py-1 rounded-md text-xs font-semibold transition-all', view === 'list'  ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500')}>List</button>
          </div>
        </div>

        {/* Result count */}
        {hasFilters && (
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="text-blue-600 font-bold">{filtered.length}</span> of {questions.length} problems
          </p>
        )}
      </div>

      {/* Problem list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">No problems found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
          <button onClick={clearAll} className="mt-4 text-sm text-blue-600 font-semibold hover:underline">Clear all filters</button>
        </div>
      ) : view === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.map((q, i) => (
            <ProblemRow key={q.id} q={q} solved={solved.has(q.id)} bookmarked={bookmarked.has(q.id)} border={i !== 0} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byTopic).map(([topicName, qs]) => {
            const topicSolved = qs.filter(q => solved.has(q.id)).length
            const topicPct    = Math.round(topicSolved / qs.length * 100)
            return (
              <div key={topicName}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{topicName}</h2>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${topicPct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{topicSolved}/{qs.length}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {qs.map((q, i) => (
                    <ProblemRow key={q.id} q={q} solved={solved.has(q.id)} bookmarked={bookmarked.has(q.id)} border={i !== 0} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProblemRow({ q, solved, bookmarked, border }: { q: Question; solved: boolean; bookmarked: boolean; border: boolean }) {
  return (
    <Link
      href={`/problems/${q.id}`}
      className={cn(
        'flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50/60 transition-all group',
        border && 'border-t border-slate-100'
      )}
    >
      <div className="shrink-0 w-5">
        {solved
          ? <CheckCircle size={17} className="text-emerald-500" />
          : <Circle size={17} className="text-slate-300 group-hover:text-blue-400 transition-colors" />}
      </div>
      <span className="flex-1 text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">{q.title}</span>
      {bookmarked && <Bookmark size={12} className="text-amber-400 shrink-0" fill="currentColor" />}
      {q.company && (
        <span className="hidden md:block text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{q.company}</span>
      )}
      {q.acceptanceRate != null && (
        <span className="hidden sm:block text-xs text-slate-400 font-mono w-14 text-right shrink-0">{q.acceptanceRate}%</span>
      )}
      <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize', getDifficultyColor(q.difficulty))}>
        {q.difficulty}
      </span>
      <span className="text-slate-300 group-hover:text-blue-400 text-xs transition-colors">→</span>
    </Link>
  )
}
