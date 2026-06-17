import { prisma } from '@/lib/prisma'
import { BookOpen, Users, Plus, Pencil } from 'lucide-react'
import Link from 'next/link'

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { id: 'asc' },
    include: {
      modules: { include: { lessons: { select: { id: true } } } },
      _count:  { select: { enrollments: true } },
    },
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" /> Courses
          </h1>
          <p className="text-slate-500 text-sm mt-1">{courses.length} courses in the platform.</p>
        </div>
        <Link href="/admin/courses/new" className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={15} /> Add Course
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Course</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Modules</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Lessons</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Users size={11} className="inline mr-1" />Enrolled
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Free</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {courses.map(c => {
              const totalLessons = c.modules.reduce((sum, m) => sum + m.lessons.length, 0)
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/courses/${c.id}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors block max-w-xs truncate">
                      {c.title}
                    </Link>
                    {c.description && (
                      <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{c.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {c.category
                      ? <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">{c.category}</span>
                      : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-semibold">{c.modules.length}</td>
                  <td className="px-4 py-3.5 text-slate-600 font-semibold">{totalLessons}</td>
                  <td className="px-4 py-3.5 text-slate-600 font-semibold">{c._count.enrollments}</td>
                  <td className="px-4 py-3.5">
                    {c.isFree
                      ? <span className="text-xs font-bold text-emerald-600">Free</span>
                      : <span className="text-xs font-bold text-amber-600">Paid</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/admin/courses/new?edit=${c.id}`} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50">
                      <Pencil size={12} /> Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
