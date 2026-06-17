import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookOpen, Code2, Trophy, Flame, CheckCircle, Clock, TrendingUp, Zap, Map, Terminal, ArrowRight, ChevronRight } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'
import { DailyChallenge } from '@/components/DailyChallenge'
import { WeeklyGoal } from '@/components/WeeklyGoal'
import { StreakCard } from '@/components/StreakCard'
import { OnboardingModal } from '@/components/OnboardingModal'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId  = parseInt((session?.user as any)?.id)
  const hour    = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const user = session?.user as any

  // --- Streak calculation ---
  function calcStreak(dates: Date[]): number {
    if (dates.length === 0) return 0
    const days = [...new Set(dates.map(d => d.toISOString().slice(0, 10)))].sort().reverse()
    const today = new Date().toISOString().slice(0, 10)
    if (days[0] !== today && days[0] !== new Date(Date.now() - 86400000).toISOString().slice(0, 10)) return 0
    let streak = 1
    for (let i = 1; i < days.length; i++) {
      const diff = (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000
      if (diff === 1) streak++; else break
    }
    return streak
  }

  const [
    enrollments,
    totalProblems,
    certs,
    recentSubs,
    enrolledCourses,
    solvedCount,
    allSubs,
    allProgress,
    solvedThisWeek,
    streakUser,
  ] = await Promise.all([
    prisma.enrollment.count({ where: { userId } }),
    prisma.practiceQuestion.count(),
    prisma.certificate.count({ where: { userId } }),
    prisma.submission.findMany({
      where: { userId },
      include: { question: { select: { title: true, difficulty: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.enrollment.findMany({
      where: { userId },
      include: { course: { include: { modules: { include: { lessons: { select: { id: true } } } } } } },
      orderBy: { enrolledAt: 'desc' },
      take: 4,
    }),
    // FIX: proper all-time solved count (distinct accepted submissions)
    prisma.submission.groupBy({
      by: ['questionId'],
      where: { userId, status: 'accepted' },
      _count: { questionId: true },
    }).then(r => r.length),
    prisma.submission.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.lessonProgress.findMany({ where: { userId }, select: { completedAt: true } }),
    // Solved problems this week (distinct)
    prisma.submission.groupBy({
      by: ['questionId'],
      where: { userId, status: 'accepted', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      _count: { questionId: true },
    }).then(r => r.length),
    prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true, longestStreak: true, onboardedAt: true, name: true, skillLevel: true, learningGoal: true, streakFreezes: true, lastFreezeUsed: true, lastStreakDate: true } }),
  ])

  const activityDates = [
    ...allSubs.map(s => s.createdAt),
    ...allProgress.map(p => p.completedAt),
  ]
  const computedStreak = calcStreak(activityDates)
  const streak = Math.max(computedStreak, streakUser?.currentStreak ?? 0)
  const todayStr     = new Date().toISOString().slice(0, 10)
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const solvedToday  = activityDates.some(d => d.toISOString().slice(0, 10) === todayStr)

  const lastFreezeUsed  = streakUser?.lastFreezeUsed ?? null
  const daysSinceFreeze = lastFreezeUsed ? (Date.now() - lastFreezeUsed.getTime()) / 86400000 : Infinity
  const freezeAvailable = daysSinceFreeze >= 7
  const nextFreezeIn    = freezeAvailable ? 0 : Math.ceil(7 - daysSinceFreeze)
  const lastStreakDate   = streakUser?.lastStreakDate?.toISOString().slice(0, 10) ?? null
  const streakAtRisk     = lastStreakDate === yesterdayStr && !solvedToday

  // Build heatmap data (last 365 days)
  const heatmapData: Record<string, number> = {}
  activityDates.forEach(d => {
    const key = d.toISOString().slice(0, 10)
    heatmapData[key] = (heatmapData[key] ?? 0) + 1
  })

  // Course progress with "continue" link (last completed lesson → next lesson)
  const progressData = await Promise.all(
    enrolledCourses.map(async (e) => {
      const totalLessons = e.course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
      const lessonIds    = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id))
      const completed    = lessonIds.length > 0
        ? await prisma.lessonProgress.count({ where: { userId, lessonId: { in: lessonIds } } })
        : 0

      // Find first incomplete lesson to resume
      const doneIds = lessonIds.length > 0
        ? (await prisma.lessonProgress.findMany({ where: { userId, lessonId: { in: lessonIds } }, select: { lessonId: true } }))
            .map(lp => lp.lessonId)
        : []
      const doneSet = new Set(doneIds)
      const allLessons = await prisma.lesson.findMany({
        where: { moduleId: { in: e.course.modules.map(m => m.id) } },
        orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
        select: { id: true },
      })
      const nextLesson = allLessons.find(l => !doneSet.has(l.id))

      return { course: e.course, totalLessons, completed, nextLessonId: nextLesson?.id ?? null }
    })
  )

  // Recommended problems: unsolved, from user's weak topics
  const weakTopics = await (async () => {
    const topicSolved: Record<string, number> = {}
    const topicTotal: Record<string, number>  = {}
    const allQ = await prisma.practiceQuestion.findMany({ select: { id: true, topic: true } })
    allQ.forEach(q => { if (q.topic) topicTotal[q.topic] = (topicTotal[q.topic] ?? 0) + 1 })
    const solvedQ = await prisma.submission.findMany({
      where: { userId, status: 'accepted' },
      distinct: ['questionId'],
      select: { question: { select: { topic: true } } },
    })
    solvedQ.forEach(s => {
      const t = s.question.topic
      if (t) topicSolved[t] = (topicSolved[t] ?? 0) + 1
    })
    // Sort topics by lowest solved-to-total ratio
    return Object.keys(topicTotal)
      .filter(t => topicTotal[t] > 0)
      .sort((a, b) => {
        const ra = (topicSolved[a] ?? 0) / topicTotal[a]
        const rb = (topicSolved[b] ?? 0) / topicTotal[b]
        return ra - rb
      })
      .slice(0, 2)
  })()

  const solvedIds = solvedCount > 0
    ? (await prisma.submission.findMany({
        where: { userId, status: 'accepted' },
        distinct: ['questionId'],
        select: { questionId: true },
      })).map(s => s.questionId)
    : []

  // Map skill level → preferred difficulties
  const skillDifficulties: Record<string, string[]> = {
    beginner:     ['Easy'],
    intermediate: ['Easy', 'Medium'],
    advanced:     ['Medium', 'Hard'],
  }
  const preferredDiffs = skillDifficulties[streakUser?.skillLevel ?? ''] ?? undefined

  const recommended = weakTopics.length > 0
    ? await prisma.practiceQuestion.findMany({
        where: {
          topic:      { in: weakTopics },
          difficulty: preferredDiffs ? { in: preferredDiffs } : undefined,
          id:         solvedIds.length > 0 ? { notIn: solvedIds } : undefined,
        },
        orderBy: { difficulty: 'asc' },
        take: 4,
        select: { id: true, title: true, difficulty: true, topic: true },
      })
    : []

  const DIFF_COLOR: Record<string, string> = {
    Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
    Medium: 'text-amber-600 bg-amber-50 border-amber-200',
    Hard:   'text-red-500 bg-red-50 border-red-200',
  }

  const stats = [
    { label: 'Courses Enrolled', value: String(enrollments),              icon: BookOpen, color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100',    href: '/courses' },
    { label: 'Problems Solved',  value: `${solvedCount} / ${totalProblems}`, icon: Code2,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', href: '/problems' },
    { label: 'Certificates',     value: String(certs),                    icon: Trophy,   color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',   href: '/certificates' },
    { label: 'Day Streak',       value: streak > 0 ? `🔥 ${streak}` : '—', icon: Flame,  color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100',  href: '/progress' },
  ]

  const showOnboarding = !streakUser?.onboardedAt

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
      {showOnboarding && <OnboardingModal userName={streakUser?.name ?? user?.name ?? 'there'} />}
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {streakUser?.learningGoal === 'interviews' && 'Preparing for technical interviews — keep grinding!'}
            {streakUser?.learningGoal === 'courses'    && 'Building your skills through structured learning.'}
            {streakUser?.learningGoal === 'practice'   && 'Staying sharp with daily practice.'}
            {streakUser?.learningGoal === 'fun'        && 'Exploring at your own pace — enjoy the journey!'}
            {!streakUser?.learningGoal                 && 'Here\'s your learning progress at a glance.'}
          </p>
        </div>
        <Link href="/problems" className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Zap size={15} /> Practice Now
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className={`border ${s.border} hover:shadow-md transition-all cursor-pointer`}>
              <CardBody className="flex items-center gap-4 py-4">
                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`${s.color} w-5 h-5`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-slate-900 leading-none">{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { href: '/roadmap',    icon: Map,      label: 'Learning Roadmaps', desc: 'Structured paths to mastery',  color: 'from-blue-500 to-cyan-500' },
          { href: '/playground', icon: Terminal, label: 'Code Playground',   desc: '10 languages, run instantly',  color: 'from-violet-500 to-purple-600' },
          { href: '/interview',  icon: Zap,      label: 'Mock Interview',    desc: 'Timed coding under pressure', color: 'from-orange-500 to-red-500' },
        ].map(a => (
          <Link key={a.href} href={a.href} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0 shadow-sm`}>
              <a.icon size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{a.label}</p>
              <p className="text-xs text-slate-400 truncate">{a.desc}</p>
            </div>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 shrink-0 ml-auto transition-colors" />
          </Link>
        ))}
      </div>

      {/* Activity heatmap */}
      <Card className="mb-8">
        <CardBody className="py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame size={14} className="text-orange-500" /> Coding Activity
            </h2>
            <Link href="/progress" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              Full report →
            </Link>
          </div>
          <ActivityHeatmap data={heatmapData} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" /> My Courses
              </h2>
              <Link href="/courses" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                Browse all →
              </Link>
            </div>
            {progressData.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-600 font-semibold">No courses enrolled yet</p>
                  <p className="text-sm text-slate-400 mt-1">Browse our catalog to get started.</p>
                  <Link href="/courses" className="mt-4 inline-block bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Browse Courses
                  </Link>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {progressData.map(({ course, totalLessons, completed, nextLessonId }) => {
                  const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0
                  const continueHref = nextLessonId ? `/lessons/${nextLessonId}` : `/courses/${course.id}`
                  return (
                    <Card key={course.id}>
                      <CardBody className="flex items-center gap-4 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {course.title[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate mb-2">{course.title}</p>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-violet-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5">
                            {completed} of {totalLessons} lessons ·{' '}
                            <span className="font-semibold text-blue-600">{pct}%</span>
                            {pct === 100 && <span className="ml-1 text-emerald-600 font-semibold">· Complete ✓</span>}
                          </p>
                        </div>
                        <Link
                          href={continueHref}
                          className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {pct === 100 ? 'Review' : pct === 0 ? 'Start' : 'Continue'}
                        </Link>
                      </CardBody>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recommended problems */}
          {recommended.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRight size={16} className="text-violet-500" /> Recommended for You
                </h2>
                <Link href="/problems" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">All problems →</Link>
              </div>
              <Card>
                <div className="divide-y divide-slate-50">
                  {recommended.map(p => (
                    <Link
                      key={p.id}
                      href={`/problems/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                    >
                      <Code2 size={14} className="text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                      <span className="flex-1 text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate">{p.title}</span>
                      {p.topic && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 hidden sm:block">{p.topic}</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${DIFF_COLOR[p.difficulty] ?? ''}`}>
                        {p.difficulty}
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right column: daily challenge + weekly goal + recent submissions */}
        <div className="space-y-6">
          <DailyChallenge />
          <StreakCard
            currentStreak={streak}
            longestStreak={streakUser?.longestStreak ?? streak}
            solvedToday={solvedToday}
            freezesLeft={streakUser?.streakFreezes ?? 1}
            freezeAvailable={freezeAvailable}
            nextFreezeIn={nextFreezeIn}
            streakAtRisk={streakAtRisk}
          />
          <WeeklyGoal solvedThisWeek={solvedThisWeek} />

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-slate-400" /> Recent Submissions
            </h2>
            <Card>
              {recentSubs.length === 0 ? (
                <CardBody className="text-center py-12">
                  <Code2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-600 font-semibold">No submissions yet</p>
                  <Link href="/problems" className="mt-4 inline-block text-sm text-blue-600 font-semibold hover:underline">
                    Start practicing →
                  </Link>
                </CardBody>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentSubs.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/problems/${sub.questionId}`}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${sub.status === 'accepted' ? 'bg-emerald-100' : 'bg-red-50'}`}>
                        {sub.status === 'accepted'
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          : <Clock className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-medium truncate group-hover:text-blue-600 transition-colors">{sub.question.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {sub.language} · <span className={sub.status === 'accepted' ? 'text-emerald-600 font-semibold' : 'text-red-500'}>{sub.status}</span>
                        </p>
                      </div>
                    </Link>
                  ))}
                  <div className="px-4 py-3 text-center">
                    <Link href="/submissions" className="text-xs text-blue-600 font-semibold hover:underline">View all submissions →</Link>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
