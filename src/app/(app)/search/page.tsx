'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { Search, BookOpen, Code2, Loader2, Building2, PlayCircle, FileText } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600   bg-amber-50   border-amber-200',
  Hard:   'text-red-500     bg-red-50     border-red-200',
}


export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading…</div>}>
      <SearchPage />
    </Suspense>
  )
}

function SearchPage() {
  const params = useSearchParams()
  const [query, setQuery]     = useState(params.get('q') || '')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const debounce              = useRef<any>(null)

  useEffect(() => {
    if (query.length < 2) { setResults(null); return }
    setLoading(true)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
      setLoading(false)
    }, 280)
  }, [query])

  const total = results ? results.courses.length + results.problems.length + (results.lessons?.length ?? 0) : 0

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fadeIn">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Search</h1>

      {/* Search input */}
      <div className="relative mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search courses, lessons, problems, topics, companies…"
          className="w-full pl-11 pr-5 py-4 text-base rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Results */}
      {!query || query.length < 2 ? (
        <div className="text-center py-20 text-slate-400">
          <Search size={40} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold">Type to search across courses, lessons, and problems</p>
          <p className="text-sm mt-1">Try "array", "react", "Amazon", "easy"…</p>
        </div>
      ) : results && total === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="font-semibold">No results for "{query}"</p>
          <p className="text-sm mt-1">Try a different keyword.</p>
        </div>
      ) : results && (
        <div className="space-y-8 animate-fadeIn">
          {/* Courses */}
          {results.courses.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen size={12} /> Courses · {results.courses.length}
              </h2>
              <div className="space-y-2">
                {results.courses.map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {c.title[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{c.title}</p>
                      {c.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{c.description}</p>}
                    </div>
                    {c.category && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 bg-slate-50 text-slate-600 border-slate-200">
                        {c.category}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Lessons */}
          {results.lessons?.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <PlayCircle size={12} /> Lessons · {results.lessons.length}
              </h2>
              <div className="space-y-2">
                {results.lessons.map((l: any) => (
                  <Link
                    key={l.id}
                    href={`/lessons/${l.id}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      {l.type === 'video'
                        ? <PlayCircle size={16} className="text-violet-500" />
                        : <FileText size={16} className="text-violet-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{l.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {l.module.course.title} · {l.module.title}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 bg-violet-50 text-violet-600 border-violet-200 capitalize">
                      {l.type}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Problems */}
          {results.problems.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Code2 size={12} /> Problems · {results.problems.length}
              </h2>
              <div className="space-y-2">
                {results.problems.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/problems/${p.id}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Code2 size={16} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.topic && <span className="text-xs text-slate-400">{p.topic}</span>}
                        {p.company && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Building2 size={10} /> {p.company}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${DIFF_COLOR[p.difficulty] || ''}`}>
                      {p.difficulty}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
