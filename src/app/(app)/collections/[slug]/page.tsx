import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ChevronRight, Building2, Tag, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600 bg-amber-50 border-amber-200',
  Hard:   'text-red-500 bg-red-50 border-red-200',
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session  = await getServerSession(authOptions)
  const rawId    = parseInt((session?.user as any)?.id)
  const userId   = isNaN(rawId) ? -1 : rawId

  const collection = await prisma.problemCollection.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          question: {
            select: { id: true, title: true, difficulty: true, topic: true, company: true },
          },
        },
      },
    },
  })

  if (!collection) notFound()

  const solvedSet = new Set<number>()
  if (userId !== -1) {
    const solved = await prisma.submission.findMany({
      where: { userId, status: 'accepted' },
      distinct: ['questionId'],
      select: { questionId: true },
    })
    solved.forEach(s => solvedSet.add(s.questionId))
  }

  const total  = collection.items.length
  const solved = collection.items.filter(i => solvedSet.has(i.questionId)).length
  const pct    = total > 0 ? Math.round((solved / total) * 100) : 0

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fadeIn">
      {/* Back */}
      <Link href="/collections" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-6">
        <ArrowLeft size={14} /> All Collections
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="text-4xl w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center shrink-0">
          {collection.icon ?? '📚'}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{collection.title}</h1>
          {collection.description && (
            <p className="text-slate-500 text-sm leading-relaxed">{collection.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm text-slate-500">{total} problems</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm font-bold text-slate-700">{solved}/{total}</span>
              {pct === 100 && <CheckCircle size={15} className="text-emerald-500" />}
            </div>
          </div>
        </div>
      </div>

      {/* Problems list */}
      <Card>
        <div className="divide-y divide-slate-50">
          {collection.items.map((item, i) => {
            const q      = item.question
            const isDone = solvedSet.has(q.id)
            return (
              <Link
                key={item.id}
                href={`/problems/${q.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
              >
                <span className="text-xs text-slate-300 font-mono w-6 shrink-0">{i + 1}</span>

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isDone ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 group-hover:border-blue-300'
                }`}>
                  {isDone && <CheckCircle size={12} className="text-emerald-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate transition-colors group-hover:text-blue-700 ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {q.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {q.topic && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Tag size={9} /> {q.topic}
                      </span>
                    )}
                    {q.company && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building2 size={9} /> {q.company}
                      </span>
                    )}
                  </div>
                </div>

                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${DIFF_COLOR[q.difficulty] ?? ''}`}>
                  {q.difficulty}
                </span>

                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </Link>
            )
          })}
          {collection.items.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">
              No problems in this collection yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
