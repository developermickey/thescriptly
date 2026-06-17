import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Code2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'
import { SubmissionsClient } from './SubmissionsClient'

export default async function SubmissionsPage() {
  const session = await getServerSession(authOptions)
  const rawId   = parseInt((session?.user as any)?.id)
  const userId  = isNaN(rawId) ? -1 : rawId

  const submissions = await prisma.submission.findMany({
    where: { userId },
    include: { question: { select: { id: true, title: true, difficulty: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const total       = submissions.length
  const accepted    = submissions.filter(s => s.status === 'accepted').length
  const uniqueSolved = new Set(submissions.filter(s => s.status === 'accepted').map(s => s.questionId)).size
  const acceptRate  = total > 0 ? Math.round((accepted / total) * 100) : 0

  const stats = [
    { label: 'Total Submissions', value: total,       color: 'text-slate-900',    border: 'border-slate-200' },
    { label: 'Accepted',          value: accepted,    color: 'text-emerald-600',  border: 'border-emerald-200' },
    { label: 'Problems Solved',   value: uniqueSolved, color: 'text-blue-600',    border: 'border-blue-200' },
    { label: 'Acceptance Rate',   value: `${acceptRate}%`, color: 'text-violet-600', border: 'border-violet-200' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Submission History</h1>
        <p className="text-slate-500 mt-1 text-sm">Click any row to view the submitted code.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`bg-white rounded-xl border ${s.border} shadow-sm p-5`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardBody className="text-center py-20">
            <Code2 className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-600 font-bold text-lg">No submissions yet</p>
            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Solve your first problem to see your history here.</p>
            <Link href="/problems" className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
              <Code2 size={15} /> Browse Problems
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <SubmissionsClient submissions={submissions as any} />
        </Card>
      )}
    </div>
  )
}
