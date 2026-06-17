'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, BookOpen, Code2, PlayCircle, X, ArrowRight } from 'lucide-react'
import { cn, getDifficultyColor } from '@/lib/utils'

interface Course    { id: number; title: string; category: string | null }
interface Problem   { id: number; title: string; difficulty: string; topic: string | null; company: string | null }
interface Lesson    { id: number; title: string; type: string; module: { title: string; course: { id: number; title: string } } }
interface Results   { courses: Course[]; problems: Problem[]; lessons: Lesson[] }

type ResultItem =
  | { kind: 'course';  data: Course }
  | { kind: 'problem'; data: Problem }
  | { kind: 'lesson';  data: Lesson }

export function CommandPalette() {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Results>({ courses: [], problems: [], lessons: [] })
  const [loading, setLoading] = useState(false)
  const [cursor,  setCursor]  = useState(0)
  const inputRef  = useRef<HTMLInputElement>(null)
  const debounce  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const router    = useRouter()

  // Global shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30)
      setQuery('')
      setResults({ courses: [], problems: [], lessons: [] })
      setCursor(0)
    }
  }, [open])

  // Debounced search
  const search = useCallback((q: string) => {
    clearTimeout(debounce.current)
    if (!q.trim() || q.length < 2) {
      setResults({ courses: [], problems: [], lessons: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data: Results = await res.json()
        setResults(data)
        setCursor(0)
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    search(e.target.value)
  }

  // Flatten results for keyboard nav
  const flat: ResultItem[] = [
    ...results.courses.map(d => ({ kind: 'course'  as const, data: d })),
    ...results.problems.map(d => ({ kind: 'problem' as const, data: d })),
    ...results.lessons.map(d  => ({ kind: 'lesson'  as const, data: d })),
  ]

  function navigate(item: ResultItem) {
    setOpen(false)
    if (item.kind === 'course')  router.push(`/courses/${item.data.id}`)
    if (item.kind === 'problem') router.push(`/problems/${item.data.id}`)
    if (item.kind === 'lesson')  router.push(`/lessons/${item.data.id}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && flat[cursor]) navigate(flat[cursor])
  }

  const hasResults = flat.length > 0

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-slate-900/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search size={17} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onKeyDown={onKeyDown}
            placeholder="Search courses, problems, lessons…"
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
          )}
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!hasResults && query.length >= 2 && !loading && (
            <div className="py-12 text-center text-sm text-slate-400">No results for &ldquo;{query}&rdquo;</div>
          )}

          {!hasResults && query.length < 2 && (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">Type to search across the platform</p>
              <p className="text-xs text-slate-300 mt-1">↑↓ to navigate · Enter to open · Esc to close</p>
            </div>
          )}

          {results.courses.length > 0 && (
            <Section label="Courses">
              {results.courses.map((c, i) => {
                const idx = results.courses.indexOf(c)
                const flatIdx = idx
                return (
                  <ResultRow
                    key={`course-${c.id}`}
                    icon={<BookOpen size={14} className="text-blue-500" />}
                    title={c.title}
                    meta={c.category ?? ''}
                    active={cursor === flatIdx}
                    onClick={() => navigate({ kind: 'course', data: c })}
                    onHover={() => setCursor(flatIdx)}
                  />
                )
              })}
            </Section>
          )}

          {results.problems.length > 0 && (
            <Section label="Problems">
              {results.problems.map((p) => {
                const flatIdx = results.courses.length + results.problems.indexOf(p)
                return (
                  <ResultRow
                    key={`problem-${p.id}`}
                    icon={<Code2 size={14} className="text-violet-500" />}
                    title={p.title}
                    meta={p.topic ?? ''}
                    badge={p.difficulty}
                    badgeClass={getDifficultyColor(p.difficulty)}
                    active={cursor === flatIdx}
                    onClick={() => navigate({ kind: 'problem', data: p })}
                    onHover={() => setCursor(flatIdx)}
                  />
                )
              })}
            </Section>
          )}

          {results.lessons.length > 0 && (
            <Section label="Lessons">
              {results.lessons.map((l) => {
                const flatIdx = results.courses.length + results.problems.length + results.lessons.indexOf(l)
                return (
                  <ResultRow
                    key={`lesson-${l.id}`}
                    icon={<PlayCircle size={14} className="text-emerald-500" />}
                    title={l.title}
                    meta={l.module.course.title}
                    active={cursor === flatIdx}
                    onClick={() => navigate({ kind: 'lesson', data: l })}
                    onHover={() => setCursor(flatIdx)}
                  />
                )
              })}
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50">
          <span className="text-xs text-slate-400 flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-sm">⌘K</kbd> toggle</span>
          <span className="text-xs text-slate-400 flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-sm">↑↓</kbd> navigate</span>
          <span className="text-xs text-slate-400 flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-sm">↵</kbd> open</span>
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {children}
    </div>
  )
}

function ResultRow({
  icon, title, meta, badge, badgeClass, active, onClick, onHover,
}: {
  icon: React.ReactNode
  title: string
  meta: string
  badge?: string
  badgeClass?: string
  active: boolean
  onClick: () => void
  onHover: () => void
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
        active ? 'bg-blue-50' : 'hover:bg-slate-50'
      )}
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md bg-slate-100">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-slate-800 truncate">{title}</span>
        {meta && <span className="block text-xs text-slate-400 truncate">{meta}</span>}
      </span>
      {badge && (
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize shrink-0', badgeClass)}>{badge}</span>
      )}
      {active && <ArrowRight size={13} className="text-blue-400 shrink-0" />}
    </button>
  )
}
