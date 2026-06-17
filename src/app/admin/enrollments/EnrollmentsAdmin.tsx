'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Download, ChevronLeft, ChevronRight, BookOpen, Search } from 'lucide-react'

interface User   { id: number; name: string; email: string }
interface Course { id: number; title: string }
interface Enrollment { id: number; enrolledAt: string; user: User; course: Course }

interface Props {
  courses:          Course[]
  enrollments:      Enrollment[]
  courseCountMap:   Record<number, number>
  total:            number
  page:             number
  perPage:          number
  selectedCourseId: number | null
}

export function EnrollmentsAdmin({ courses, enrollments, courseCountMap, total, page, perPage, selectedCourseId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const totalPages = Math.ceil(total / perPage)

  function navigate(courseId: number | null, p: number) {
    const params = new URLSearchParams()
    if (courseId) params.set('course', String(courseId))
    if (p > 1)    params.set('page', String(p))
    router.push('/admin/enrollments' + (params.toString() ? '?' + params.toString() : ''))
  }

  function exportCSV() {
    const rows = [['ID', 'Name', 'Email', 'Course', 'Enrolled At']]
    enrollments.forEach(e => {
      rows.push([String(e.id), e.user.name, e.user.email, e.course.title, new Date(e.enrolledAt).toLocaleDateString()])
    })
    const csv  = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `enrollments${selectedCourseId ? `-course-${selectedCourseId}` : ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const visible = search
    ? enrollments.filter(e =>
        e.user.name.toLowerCase().includes(search.toLowerCase()) ||
        e.user.email.toLowerCase().includes(search.toLowerCase())
      )
    : enrollments

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Enrollments</h1>
            <p className="text-xs text-slate-500">{total.toLocaleString()} total enrollments</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Course filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          onClick={() => navigate(null, 1)}
          className={`text-left px-4 py-3 rounded-xl border transition-all ${
            !selectedCourseId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen size={12} />
            <span className="text-xs font-bold">All Courses</span>
          </div>
          <div className="text-xl font-black">{Object.values(courseCountMap).reduce((a, b) => a + b, 0)}</div>
        </button>
        {courses.map(c => (
          <button
            key={c.id}
            onClick={() => navigate(c.id, 1)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${
              selectedCourseId === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="text-xs font-bold mb-1 truncate">{c.title}</div>
            <div className="text-xl font-black">{courseCountMap[c.id] ?? 0}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name or email…"
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {selectedCourseId && (
            <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-medium">
              {courses.find(c => c.id === selectedCourseId)?.title}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Email</th>
                {!selectedCourseId && (
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Course</th>
                )}
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">No enrollments found.</td>
                </tr>
              ) : visible.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{e.user.name}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{e.user.email}</td>
                  {!selectedCourseId && (
                    <td className="px-5 py-3 text-slate-600 text-xs">{e.course.title}</td>
                  )}
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {new Date(e.enrolledAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(selectedCourseId, page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button
                onClick={() => navigate(selectedCourseId, page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
