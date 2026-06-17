import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { ROADMAPS } from '@/lib/roadmaps'
import Link from 'next/link'
import { Map, ArrowLeft, Clock, CheckCircle2, Circle, ChevronRight, Code2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600   bg-amber-50   border-amber-200',
  Hard:   'text-red-500     bg-red-50     border-red-200',
  Mixed:  'text-slate-600   bg-slate-50   border-slate-200',
}

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const roadmap = ROADMAPS.find(r => r.id === id)
  if (!roadmap) notFound()

  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = parseInt((session.user as any).id)

  // All topics in this roadmap
  const topics = roadmap.steps.map(s => s.topic)

  // Problems per topic
  const allProblems = await prisma.practiceQuestion.findMany({
    where: { topic: { in: topics } },
    select: { id: true, title: true, difficulty: true, topic: true, company: true },
    orderBy: [{ difficulty: 'asc' }, { id: 'asc' }],
  })

  // Which ones user has solved
  const solvedRaw = await prisma.submission.findMany({
    where: {
      userId,
      status: 'accepted',
      questionId: { in: allProblems.map(p => p.id) },
    },
    distinct: ['questionId'],
    select: { questionId: true },
  })
  const solvedSet = new Set(solvedRaw.map(s => s.questionId))

  // Group problems by topic
  const byTopic: Record<string, typeof allProblems> = {}
  allProblems.forEach(p => {
    const t = p.topic!
    byTopic[t] = [...(byTopic[t] ?? []), p]
  })

  const totalProblems = allProblems.length
  const totalSolved   = solvedRaw.length
  const pct           = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Back */}
      <Link href="/roadmap" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft size={14} /> All Roadmaps
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roadmap.gradient} flex items-center justify-center text-3xl shadow-md`}>
            {roadmap.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{roadmap.title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{roadmap.description}</p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1"><Clock size={11} /> ~{roadmap.estimatedWeeks} weeks</span>
          <span>·</span>
          <span>{roadmap.steps.length} topics</span>
          <span>·</span>
          <span>{totalProblems} problems</span>
        </div>

        {/* Overall progress */}
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700">Your Progress</span>
              <span className={`text-sm font-bold ${roadmap.color}`}>{totalSolved}/{totalProblems} solved · {pct}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${roadmap.gradient} rounded-full transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {roadmap.steps.map((step, i) => {
          const problems    = byTopic[step.topic] ?? []
          const doneCnt     = problems.filter(p => solvedSet.has(p.id)).length
          const stepDone    = doneCnt === problems.length && problems.length > 0
          const stepStarted = doneCnt > 0

          return (
            <div key={step.topic} className="relative">
              {/* Connector line */}
              {i < roadmap.steps.length - 1 && (
                <div className="absolute left-5 top-14 bottom-0 w-px bg-slate-200 -mb-4 z-0" />
              )}

              <Card className={`relative z-10 ${stepDone ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
                <CardBody className="py-4">
                  {/* Step header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      stepDone    ? 'bg-emerald-500 text-white' :
                      stepStarted ? 'bg-blue-100 text-blue-600' :
                                    'bg-slate-100 text-slate-400'
                    }`}>
                      {stepDone
                        ? <CheckCircle2 size={18} />
                        : <span className="text-sm font-bold">{i + 1}</span>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-slate-900">{step.label}</h2>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFF_COLOR[step.difficulty]}`}>
                          {step.difficulty}
                        </span>
                        {stepDone && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Complete ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                    </div>

                    <div className="text-xs text-slate-400 shrink-0 text-right">
                      <span className={`font-bold ${stepStarted ? 'text-blue-600' : ''}`}>{doneCnt}</span>/{problems.length}
                    </div>
                  </div>

                  {/* Progress mini-bar */}
                  {problems.length > 0 && (
                    <div className="mb-3 ml-13 pl-13">
                      <div className="ml-[52px] h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${roadmap.gradient} transition-all`}
                          style={{ width: `${problems.length > 0 ? Math.round((doneCnt / problems.length) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Problem list */}
                  {problems.length === 0 ? (
                    <div className="ml-[52px] text-xs text-slate-400 italic">No problems available for this topic yet.</div>
                  ) : (
                    <div className="ml-[52px] space-y-1">
                      {problems.map(p => {
                        const isSolved = solvedSet.has(p.id)
                        return (
                          <Link
                            key={p.id}
                            href={`/problems/${p.id}`}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group text-sm ${
                              isSolved ? 'text-slate-500' : 'text-slate-700'
                            }`}
                          >
                            {isSolved
                              ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              : <Circle size={13} className="text-slate-300 shrink-0 group-hover:text-blue-400 transition-colors" />
                            }
                            <span className={`flex-1 truncate ${isSolved ? 'line-through opacity-60' : 'group-hover:text-blue-600'} transition-colors`}>
                              {p.title}
                            </span>
                            {p.company && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 hidden sm:block">
                                {p.company}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${DIFF_COLOR[p.difficulty] ?? ''}`}>
                              {p.difficulty[0]}
                            </span>
                            <ChevronRight size={11} className="text-slate-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Code2 size={14} /> Browse all problems
        </Link>
      </div>
    </div>
  )
}
