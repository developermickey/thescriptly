import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Layers, CheckCircle, ChevronRight, Pin } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'

export const metadata = { title: 'Problem Collections · Codex' }

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions)
  const rawId   = parseInt((session?.user as any)?.id)
  const userId  = isNaN(rawId) ? -1 : rawId

  const collections = await prisma.problemCollection.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    include: {
      items: { include: { question: { select: { id: true, difficulty: true } } } },
    },
  })

  const solvedSet = new Set<number>()
  if (userId !== -1) {
    const solved = await prisma.submission.findMany({
      where: { userId, status: 'accepted' },
      distinct: ['questionId'],
      select: { questionId: true },
    })
    solved.forEach(s => solvedSet.add(s.questionId))
  }

  const data = collections.map(c => ({
    slug:     c.slug,
    title:    c.title,
    description: c.description,
    icon:     c.icon ?? '📚',
    isPinned: c.isPinned,
    total:    c.items.length,
    solved:   c.items.filter(i => solvedSet.has(i.questionId)).length,
    easy:     c.items.filter(i => i.question.difficulty === 'Easy').length,
    medium:   c.items.filter(i => i.question.difficulty === 'Medium').length,
    hard:     c.items.filter(i => i.question.difficulty === 'Hard').length,
  }))

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Layers size={22} className="text-blue-600" /> Problem Collections
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Curated sets of problems to master specific skills or prepare for interviews.</p>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardBody className="text-center py-20">
            <Layers size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold">No collections yet</p>
            <p className="text-sm text-slate-400 mt-1">Check back soon — curated problem sets are coming.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.map(c => {
            const pct = c.total > 0 ? Math.round((c.solved / c.total) * 100) : 0
            return (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all block"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl shrink-0 w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{c.title}</h2>
                      {c.isPinned && <Pin size={12} className="text-amber-500 shrink-0" />}
                    </div>
                    {c.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{c.description}</p>
                    )}

                    {/* Difficulty pills */}
                    <div className="flex gap-1.5 mb-3">
                      {c.easy   > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{c.easy}E</span>}
                      {c.medium > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{c.medium}M</span>}
                      {c.hard   > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">{c.hard}H</span>}
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                        {c.solved}/{c.total}
                      </span>
                      {pct === 100 && <CheckCircle size={13} className="text-emerald-500 shrink-0" />}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
