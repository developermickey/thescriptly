import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TrendingUp, Code2, BookOpen, Trophy, CheckCircle2, Flame } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'
import { ProgressCharts } from './ProgressCharts'

export default async function ProgressPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = parseInt((session.user as any).id)

  // Last 12 weeks daily buckets
  const since12w = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000)
  const since4w  = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)

  const [allSubs, lessonProgress, enrollments] = await Promise.all([
    prisma.submission.findMany({
      where: { userId, createdAt: { gte: since12w } },
      select: { createdAt: true, status: true, question: { select: { difficulty: true, topic: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completedAt: { gte: since12w } },
      select: { completedAt: true, lesson: { select: { module: { select: { courseId: true, course: { select: { title: true } } } } } } },
    }),
    prisma.enrollment.findMany({
      where: { userId },
      select: {
        courseId: true,
        course: {
          select: {
            title: true,
            _count: { select: { modules: true } },
            modules: {
              select: {
                _count: { select: { lessons: true } },
              },
            },
          },
        },
      },
    }),
  ])

  // All-time stats
  const [totalSolved, totalLessons, totalCerts] = await Promise.all([
    prisma.submission.count({ where: { userId, status: 'accepted' } }),
    prisma.lessonProgress.count({ where: { userId } }),
    prisma.certificate.count({ where: { userId } }),
  ])

  // Streak
  const allSubDates = (await prisma.submission.findMany({
    where: { userId }, select: { createdAt: true },
  })).map(s => s.createdAt.toISOString().slice(0, 10))
  const lessonDates = (await prisma.lessonProgress.findMany({
    where: { userId }, select: { completedAt: true },
  })).map(l => l.completedAt.toISOString().slice(0, 10))

  const allDays = [...new Set([...allSubDates, ...lessonDates])].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().slice(0, 10)
  const yest  = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (allDays[0] === today || allDays[0] === yest) {
    streak = 1
    for (let i = 1; i < allDays.length; i++) {
      const diff = (new Date(allDays[i - 1]).getTime() - new Date(allDays[i]).getTime()) / 86400000
      if (diff === 1) streak++; else break
    }
  }

  // Build 12-week daily chart data
  const days: string[] = []
  for (let i = 83; i >= 0; i--) {
    days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10))
  }

  const subByDay: Record<string, number>    = {}
  const acceptByDay: Record<string, number> = {}
  const lessonByDay: Record<string, number> = {}

  allSubs.forEach(s => {
    const d = s.createdAt.toISOString().slice(0, 10)
    subByDay[d]    = (subByDay[d]    ?? 0) + 1
    if (s.status === 'accepted') acceptByDay[d] = (acceptByDay[d] ?? 0) + 1
  })
  lessonProgress.forEach(l => {
    const d = l.completedAt.toISOString().slice(0, 10)
    lessonByDay[d] = (lessonByDay[d] ?? 0) + 1
  })

  const chartDays = days.map(d => ({
    date:       d,
    label:      new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    subs:       subByDay[d]    ?? 0,
    accepted:   acceptByDay[d] ?? 0,
    lessons:    lessonByDay[d] ?? 0,
  }))

  // Topic breakdown (all-time)
  const topicSubs = await prisma.submission.findMany({
    where: { userId, status: 'accepted' },
    distinct: ['questionId'],
    select: { question: { select: { topic: true, difficulty: true } } },
  })
  const topicMap: Record<string, number> = {}
  const diffMap  = { Easy: 0, Medium: 0, Hard: 0 }
  topicSubs.forEach(s => {
    const t = s.question.topic || 'Other'
    topicMap[t] = (topicMap[t] ?? 0) + 1
    const d = s.question.difficulty as keyof typeof diffMap
    if (d in diffMap) diffMap[d]++
  })
  const topTopics = Object.entries(topicMap).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Course completion
  const lessonDoneSet = new Set(
    (await prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true } }))
      .map(l => l.lessonId)
  )
  const coursesWithProgress = enrollments.map(e => {
    const totalLessonCount = e.course.modules.reduce((sum, m) => sum + m._count.lessons, 0)
    return {
      courseId:    e.courseId,
      title:       e.course.title,
      total:       totalLessonCount,
      done:        0, // we'll use a rough proxy below
    }
  })
  // Count completed lessons per course
  const completedPerCourse: Record<number, number> = {}
  lessonProgress.forEach(l => {
    const cid = l.lesson.module.courseId
    completedPerCourse[cid] = (completedPerCourse[cid] ?? 0) + 1
  })
  // Use all-time lesson progress for accuracy
  const allLessonProgressCourse = await prisma.lessonProgress.findMany({
    where: { userId },
    select: { lesson: { select: { module: { select: { courseId: true } } } } },
  })
  const completedAllTime: Record<number, number> = {}
  allLessonProgressCourse.forEach(l => {
    const cid = l.lesson.module.courseId
    completedAllTime[cid] = (completedAllTime[cid] ?? 0) + 1
  })
  const courseFinal = coursesWithProgress.map(c => ({ ...c, done: completedAllTime[c.courseId] ?? 0 }))

  // 4-week acceptance rate
  const recent4wSubs    = allSubs.filter(s => s.createdAt >= since4w)
  const recent4wAccepted = recent4wSubs.filter(s => s.status === 'accepted')
  const acceptRate = recent4wSubs.length > 0 ? Math.round((recent4wAccepted.length / recent4wSubs.length) * 100) : null

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp size={22} className="text-blue-600" /> Progress Report
        </h1>
        <p className="text-slate-500 text-sm mt-1">Your last 12 weeks of learning activity.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total Solved',   value: totalSolved,    icon: Code2,          color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Lessons Done',   value: totalLessons,   icon: BookOpen,       color: 'text-violet-600',  bg: 'bg-violet-50' },
          { label: 'Certificates',   value: totalCerts,     icon: Trophy,         color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Day Streak',     value: streak || '—',  icon: Flame,          color: 'text-orange-600',  bg: 'bg-orange-50' },
          { label: 'Accept Rate',    value: acceptRate !== null ? `${acceptRate}%` : '—', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardBody className="py-4 px-4 text-center">
              <s.icon size={14} className={`${s.color} mx-auto mb-1.5`} />
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Activity chart (client) */}
      <Card className="mb-6">
        <CardBody className="py-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Daily Activity · Last 12 Weeks</h2>
          <ProgressCharts days={chartDays} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Difficulty breakdown */}
        <Card>
          <CardBody className="py-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Problems by Difficulty</h2>
            {totalSolved === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No problems solved yet.</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Easy',   count: diffMap.Easy,   color: 'bg-emerald-500', text: 'text-emerald-700' },
                  { label: 'Medium', count: diffMap.Medium, color: 'bg-amber-500',   text: 'text-amber-700' },
                  { label: 'Hard',   count: diffMap.Hard,   color: 'bg-red-500',     text: 'text-red-700' },
                ].map(d => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-14 ${d.text}`}>{d.label}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${d.color} rounded-full transition-all`}
                        style={{ width: totalSolved > 0 ? `${Math.round((d.count / totalSolved) * 100)}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-8 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Top topics */}
        <Card>
          <CardBody className="py-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Strongest Topics</h2>
            {topTopics.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Solve problems to see your topic strengths.</p>
            ) : (
              <div className="space-y-2.5">
                {topTopics.map(([topic, count]) => (
                  <div key={topic} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 w-28 shrink-0 truncate">{topic}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                        style={{ width: `${Math.round((count / (topTopics[0]?.[1] ?? 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-5 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Course progress */}
      {courseFinal.length > 0 && (
        <Card>
          <CardBody className="py-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Course Progress</h2>
            <div className="space-y-4">
              {courseFinal.map(c => {
                const pct = c.total > 0 ? Math.min(100, Math.round((c.done / c.total) * 100)) : 0
                return (
                  <div key={c.courseId}>
                    <div className="flex items-center justify-between mb-1.5">
                      <Link href={`/courses/${c.courseId}`} className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                        {c.title}
                      </Link>
                      <span className="text-xs font-bold text-slate-500">
                        {pct === 100
                          ? <span className="text-emerald-600">Complete ✓</span>
                          : `${c.done}/${c.total} lessons`}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
