import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Code2, BookOpen, Trophy, Star, Flame, Calendar, Award } from 'lucide-react'
import { ALL_BADGES } from '@/lib/badges'
import { Card, CardBody } from '@/components/ui/Card'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = parseInt(id)
  if (isNaN(userId)) notFound()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatar: true, createdAt: true, role: true },
  })
  if (!user) notFound()

  const [solvedRaw, enrolled, certs, badges, recentSubs] = await Promise.all([
    prisma.submission.findMany({
      where: { userId, status: 'accepted' },
      distinct: ['questionId'],
      include: { question: { select: { difficulty: true, topic: true } } },
    }),
    prisma.enrollment.count({ where: { userId } }),
    prisma.certificate.count({ where: { userId } }),
    prisma.userBadge.findMany({ where: { userId }, orderBy: { awardedAt: 'desc' } }),
    prisma.submission.findMany({
      where: { userId },
      include: { question: { select: { title: true, difficulty: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  // Activity heatmap data
  const allSubs = await prisma.submission.findMany({
    where: { userId, createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
    select: { createdAt: true },
  })
  const heatmapData: Record<string, number> = {}
  allSubs.forEach(s => {
    const key = s.createdAt.toISOString().slice(0, 10)
    heatmapData[key] = (heatmapData[key] ?? 0) + 1
  })

  // Streak calculation
  const allDates = (await prisma.submission.findMany({ where: { userId }, select: { createdAt: true } }))
    .map(s => s.createdAt.toISOString().slice(0, 10))
  const days = [...new Set(allDates)].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().slice(0, 10)
  const yest  = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] === today || days[0] === yest) {
    streak = 1
    for (let i = 1; i < days.length; i++) {
      const diff = (new Date(days[i-1]).getTime() - new Date(days[i]).getTime()) / 86400000
      if (diff === 1) streak++; else break
    }
  }

  const solved = solvedRaw
  const easySolved   = solved.filter(s => s.question.difficulty === 'Easy').length
  const mediumSolved = solved.filter(s => s.question.difficulty === 'Medium').length
  const hardSolved   = solved.filter(s => s.question.difficulty === 'Hard').length

  // Topic breakdown
  const topicMap: Record<string, number> = {}
  solved.forEach(s => {
    const t = s.question.topic || 'Other'
    topicMap[t] = (topicMap[t] ?? 0) + 1
  })
  const topTopics = Object.entries(topicMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxTopicCount = topTopics[0]?.[1] ?? 1

  const joinDate    = new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  const earnedSlugs = new Set(badges.map(b => b.badgeSlug))

  const DIFF_COLOR: Record<string, string> = {
    Easy:   'text-emerald-600',
    Medium: 'text-amber-600',
    Hard:   'text-red-500',
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Hero */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-violet-600" />
        <CardBody className="pt-0 pb-6">
          <div className="flex items-end gap-5 -mt-10 mb-4">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${user.avatar || 'from-blue-500 to-violet-600'} flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white`}>
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Calendar size={11} /> Joined {joinDate}</span>
                {streak > 0 && (
                  <span className="flex items-center gap-1 text-orange-500 font-bold">
                    <Flame size={11} /> {streak}-day streak
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Solved',     value: solvedRaw.length, icon: Code2,    color: 'text-blue-600',    bg: 'bg-blue-50' },
              { label: 'Courses',    value: enrolled,        icon: BookOpen, color: 'text-violet-600',  bg: 'bg-violet-50' },
              { label: 'Certs',      value: certs,           icon: Trophy,   color: 'text-amber-600',   bg: 'bg-amber-50' },
              { label: 'Badges',     value: badges.length,   icon: Star,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                <s.icon size={14} className={`${s.color} mx-auto mb-1`} />
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Difficulty breakdown */}
      {solved.length > 0 && (
        <Card className="mb-6">
          <CardBody className="py-4">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Problem Breakdown</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Easy',   count: easySolved,   total: solved.length, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Medium', count: mediumSolved, total: solved.length, color: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50' },
                { label: 'Hard',   count: hardSolved,   total: solved.length, color: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50' },
              ].map(d => (
                <div key={d.label} className={`${d.bg} rounded-xl p-4`}>
                  <div className="flex items-end justify-between mb-2">
                    <span className={`text-2xl font-bold ${d.text}`}>{d.count}</span>
                    <span className={`text-xs font-semibold ${d.text} opacity-60`}>{d.label}</span>
                  </div>
                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.color} rounded-full transition-all`}
                      style={{ width: `${d.total > 0 ? Math.round((d.count / d.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Recent Submissions</h2>
          <Card>
            {recentSubs.length === 0 ? (
              <CardBody className="text-center py-10 text-slate-400 text-sm">No submissions yet.</CardBody>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentSubs.map(sub => (
                  <div key={sub.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${sub.status === 'accepted' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{sub.question.title}</p>
                      <p className={`text-xs font-bold ${DIFF_COLOR[sub.question.difficulty] ?? 'text-slate-400'}`}>
                        {sub.question.difficulty}
                      </p>
                    </div>
                    <span className={`text-xs font-bold ${sub.status === 'accepted' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
            Badges · {badges.length}/{ALL_BADGES.length}
          </h2>
          <Card>
            <CardBody>
              <div className="grid grid-cols-4 gap-2">
                {ALL_BADGES.map(badge => {
                  const earned = earnedSlugs.has(badge.slug)
                  return (
                    <div
                      key={badge.slug}
                      title={`${badge.name}: ${badge.desc}`}
                      className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                        earned ? 'bg-amber-50 border-2 border-amber-200' : 'bg-slate-50 grayscale opacity-30'
                      }`}
                    >
                      {badge.emoji}
                    </div>
                  )
                })}
              </div>
              {badges.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">No badges yet.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Activity</h2>
        <Card>
          <CardBody className="py-4">
            <ActivityHeatmap data={heatmapData} />
          </CardBody>
        </Card>
      </div>

      {/* Topic stats */}
      {topTopics.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Top Topics</h2>
          <Card>
            <CardBody className="py-4 space-y-3">
              {topTopics.map(([topic, count]) => (
                <div key={topic} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 w-32 shrink-0 truncate">{topic}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                      style={{ width: `${Math.round((count / maxTopicCount) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500 w-6 text-right shrink-0">{count}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
