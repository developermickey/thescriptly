import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Flag, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ReportActions } from './ReportActions'

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') redirect('/dashboard')

  const { status = 'open' } = await searchParams

  const [reports, counts] = await Promise.all([
    prisma.problemReport.findMany({
      where:   status === 'all' ? {} : { status },
      orderBy: { createdAt: 'desc' },
      include: {
        question: { select: { id: true, title: true } },
        user:     { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.problemReport.groupBy({
      by:     ['status'],
      _count: { id: true },
    }),
  ])

  const countMap: Record<string, number> = { open: 0, resolved: 0, dismissed: 0 }
  counts.forEach(c => { countMap[c.status] = c._count.id })

  const TYPE_LABELS: Record<string, string> = {
    wrong_answer: 'Wrong Answer',
    typo:         'Typo/Error',
    broken_test:  'Broken Test',
    other:        'Other',
  }

  const STATUS_STYLE: Record<string, string> = {
    open:      'bg-amber-100 text-amber-700 border-amber-200',
    resolved:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    dismissed: 'bg-slate-100 text-slate-500 border-slate-200',
  }

  const tabs = [
    { key: 'open',      label: 'Open',      count: countMap.open,      icon: Clock },
    { key: 'resolved',  label: 'Resolved',  count: countMap.resolved,  icon: CheckCircle },
    { key: 'dismissed', label: 'Dismissed', count: countMap.dismissed, icon: XCircle },
    { key: 'all',       label: 'All',       count: Object.values(countMap).reduce((a,b)=>a+b,0), icon: Flag },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Flag size={20} className="text-red-500" /> Problem Reports
        </h1>
        <p className="text-sm text-slate-500 mt-1">User-submitted issues with practice problems</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/admin/reports?status=${t.key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              status === t.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${status === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <Flag size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No {status !== 'all' ? status : ''} reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Link
                      href={`/problems/${r.question.id}`}
                      target="_blank"
                      className="text-sm font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      {r.question.title} <ExternalLink size={11} />
                    </Link>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status]}`}>
                      {r.status}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {TYPE_LABELS[r.type] ?? r.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mt-2 mb-3">{r.body}</p>
                  <div className="text-xs text-slate-400">
                    Reported by{' '}
                    <Link href={`/admin/users/${r.user.id}`} className="text-blue-600 hover:underline font-medium">
                      {r.user.name}
                    </Link>
                    {' '}· {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <ReportActions reportId={r.id} currentStatus={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
