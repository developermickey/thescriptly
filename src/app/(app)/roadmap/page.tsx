import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ROADMAPS } from '@/lib/roadmaps'
import Link from 'next/link'
import { Map, Clock, ChevronRight } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'

export const metadata = { title: 'Learning Roadmaps · Codex' }

export default async function RoadmapListPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = parseInt((session.user as any).id)

  // Count solved per topic for all roadmaps
  const solved = await prisma.submission.findMany({
    where: { userId, status: 'accepted' },
    distinct: ['questionId'],
    select: { question: { select: { topic: true } } },
  })
  const solvedTopicCount: Record<string, number> = {}
  solved.forEach(s => {
    const t = s.question.topic || 'Other'
    solvedTopicCount[t] = (solvedTopicCount[t] ?? 0) + 1
  })

  // Problem counts per topic
  const topicCounts = await prisma.practiceQuestion.groupBy({
    by: ['topic'],
    _count: { id: true },
  })
  const availablePerTopic: Record<string, number> = {}
  topicCounts.forEach(t => {
    if (t.topic) availablePerTopic[t.topic] = t._count.id
  })

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Map size={22} className="text-blue-600" /> Learning Roadmaps
        </h1>
        <p className="text-slate-500 text-sm mt-1">Structured paths to take your skills from zero to interview-ready.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {ROADMAPS.map(r => {
          const totalSteps   = r.steps.length
          const doneSteps    = r.steps.filter(s => (solvedTopicCount[s.topic] ?? 0) > 0).length
          const pct          = Math.round((doneSteps / totalSteps) * 100)
          const totalProbs   = r.steps.reduce((sum, s) => sum + (availablePerTopic[s.topic] ?? 0), 0)

          return (
            <Link key={r.id} href={`/roadmap/${r.id}`} className="block group">
              <Card className="h-full hover:shadow-md hover:border-blue-200 transition-all">
                <CardBody className="py-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center text-2xl shrink-0 shadow-sm`}>
                      {r.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{r.title}</h2>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.description}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500 font-medium">{doneSteps}/{totalSteps} topics started</span>
                      <span className={`text-xs font-bold ${r.color}`}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${r.gradient} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={11} /> ~{r.estimatedWeeks} weeks</span>
                    <span>·</span>
                    <span>{totalSteps} topics</span>
                    <span>·</span>
                    <span>{totalProbs} problems</span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
