'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, ChevronRight, CheckCircle, Search, X } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'

interface Course {
  id: number
  title: string
  description: string | null
  category: string | null
  isFree: boolean
  totalLessons: number
  enrolled: boolean
  pct: number
  gradient: string
  enrollCount: number
}

interface Props {
  courses: Course[]
}

export function CoursesClient({ courses }: Props) {
  const categories = useMemo(() => ['All', ...new Set(courses.map(c => c.category).filter(Boolean))] as string[], [courses])

  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all')

  const filtered = useMemo(() => courses.filter(c => {
    const matchSearch   = !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.category || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || c.category === category
    const matchPrice    = priceFilter === 'all' || (priceFilter === 'free' ? c.isFree : !c.isFree)
    return matchSearch && matchCategory && matchPrice
  }), [courses, search, category, priceFilter])

  const enrolled = filtered.filter(c => c.enrolled)
  const notEnrolled = filtered.filter(c => !c.enrolled)

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="text-slate-500 mt-1 text-sm">{courses.length} courses · master full-stack development and CS fundamentals.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                category === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Price filter */}
        <div className="flex gap-1.5">
          {(['all', 'free', 'paid'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriceFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                priceFilter === p
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Enrolled courses */}
      {enrolled.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Continue Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolled.map(course => <CourseCard key={course.id} course={course} />)}
          </div>
        </div>
      )}

      {/* All courses */}
      {notEnrolled.length > 0 && (
        <div>
          {enrolled.length > 0 && <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Browse Courses</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notEnrolled.map(course => <CourseCard key={course.id} course={course} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No courses match your filters</p>
          <button onClick={() => { setSearch(''); setCategory('All'); setPriceFilter('all') }} className="mt-3 text-sm text-blue-600 hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${course.id}`} className="block group">
      <Card className="h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        <div className={`h-40 bg-gradient-to-br ${course.gradient} rounded-t-xl flex items-center justify-center relative overflow-hidden`}>
          <BookOpen className="w-14 h-14 text-white/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {course.enrolled && (
            <div className="absolute top-3 right-3 bg-white/95 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <CheckCircle size={11} /> Enrolled
            </div>
          )}
          {course.isFree
            ? <span className="absolute top-3 left-3 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FREE</span>
            : <span className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">PAID</span>}
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-white font-bold text-base leading-snug drop-shadow-sm line-clamp-2">{course.title}</p>
          </div>
        </div>

        <CardBody className="py-4">
          {course.description && (
            <p className="text-sm text-slate-500 mb-3 line-clamp-2 leading-relaxed">{course.description}</p>
          )}
          {course.enrolled && (
            <div className="mb-3">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-600 rounded-full transition-all" style={{ width: `${course.pct}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{course.pct}% complete</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {course.category && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                  {course.category}
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={11} /> {course.totalLessons} lessons
              </span>
            </div>
            <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
