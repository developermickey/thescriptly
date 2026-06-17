import { prisma } from '@/lib/prisma'
import { Code, Activity, Plus, Pencil, Upload } from 'lucide-react'
import Link from 'next/link'

const diffColor: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  Hard:   'text-red-500 bg-red-50 border-red-200',
}

export default async function AdminProblemsPage() {
  const problems = await prisma.practiceQuestion.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { submissions: true } } },
  })

  const easy   = problems.filter(p => p.difficulty === 'Easy').length
  const medium = problems.filter(p => p.difficulty === 'Medium').length
  const hard   = problems.filter(p => p.difficulty === 'Hard').length

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Code size={20} className="text-blue-600" /> Practice Problems
          </h1>
          <p className="text-slate-500 text-sm mt-1">{problems.length} problems · {easy} Easy · {medium} Medium · {hard} Hard</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/problems/import"
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <Upload size={15} /> Bulk Import
          </Link>
          <Link
            href="/admin/problems/new"
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={15} /> Add Problem
          </Link>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">{easy} Easy</span>
        <span className="text-sm font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">{medium} Medium</span>
        <span className="text-sm font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">{hard} Hard</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider w-12">#</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Difficulty</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Topic</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Activity size={11} className="inline mr-1" />Subs
              </th>
              <th className="px-4 py-3.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {problems.map((p, i) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/problems/${p.id}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${diffColor[p.difficulty] || ''}`}>
                    {p.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{p.topic || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{p.company || '—'}</td>
                <td className="px-4 py-3 text-slate-600 font-semibold">{p._count.submissions}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/problems/new?edit=${p.id}`}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all"
                  >
                    <Pencil size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
