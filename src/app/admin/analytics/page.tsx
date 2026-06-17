import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BarChart2, Users, Code2, BookOpen, Award, TrendingUp, Download } from 'lucide-react'
import { AnalyticsChart } from './AnalyticsChart'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') redirect('/dashboard')

  const d7  = new Date(Date.now() - 7 * 86400000)
  const d30 = new Date(Date.now() - 30 * 86400000)

  const [
    totalUsers, newUsers7, newUsers30,
    totalSubs, subs7, subs30,
    acceptedAll, accepted7,
    totalEnrollments, enrollments7, enrollments30,
    totalCerts,
    subsByLang,
    enrollsByCourse,
    topSolvers,
    recentSubs,
    recentUsers,
    recentEnrolls,
    skillDist,
    goalDist,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { createdAt: { gte: d7 } } }),
    prisma.submission.count({ where: { createdAt: { gte: d30 } } }),
    prisma.submission.count({ where: { status: 'accepted' } }),
    prisma.submission.count({ where: { status: 'accepted', createdAt: { gte: d7 } } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { enrolledAt: { gte: d7 } } }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: d30 } } }),
    prisma.certificate.count(),
    prisma.submission.groupBy({ by: ['language'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.enrollment.groupBy({
      by: ['courseId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 8,
    }).then(async rows => {
      const ids     = rows.map(r => r.courseId)
      const courses = await prisma.course.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
      const map     = new Map(courses.map(c => [c.id, c.title]))
      return rows.map(r => ({ title: map.get(r.courseId) ?? `#${r.courseId}`, count: r._count.id }))
    }),
    prisma.submission.groupBy({
      by: ['userId'], where: { status: 'accepted' }, _count: { questionId: true },
      orderBy: { _count: { questionId: 'desc' } }, take: 8,
    }).then(async rows => {
      const ids   = rows.map(r => r.userId)
      const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } })
      const map   = new Map(users.map(u => [u.id, u]))
      return rows.map(r => ({ user: map.get(r.userId), solved: r._count.questionId }))
    }),
    // 30-day daily data
    prisma.submission.findMany({ where: { createdAt: { gte: d30 } }, select: { createdAt: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: d30 } }, select: { createdAt: true } }),
    prisma.enrollment.findMany({ where: { enrolledAt: { gte: d30 } }, select: { enrolledAt: true } }),
    prisma.user.groupBy({ by: ['skillLevel'], where: { skillLevel: { not: null } }, _count: { id: true } }),
    prisma.user.groupBy({ by: ['learningGoal'], where: { learningGoal: { not: null } }, _count: { id: true } }),
  ])

  function toMap(rows: { createdAt: Date }[]) {
    const m: Record<string, number> = {}
    rows.forEach(r => { const k = r.createdAt.toISOString().slice(0, 10); m[k] = (m[k] ?? 0) + 1 })
    return m
  }
  const subsMap    = toMap(recentSubs)
  const signupsMap = toMap(recentUsers)
  const enrollsMap = toMap(recentEnrolls.map(e => ({ createdAt: e.enrolledAt })))

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10)
    return { date: d, subs: subsMap[d] ?? 0, signups: signupsMap[d] ?? 0, enrolls: enrollsMap[d] ?? 0 }
  })

  const acceptRate   = totalSubs > 0 ? Math.round(acceptedAll / totalSubs * 100) : 0
  const acceptRate7  = subs7 > 0 ? Math.round(accepted7 / subs7 * 100) : 0
  const totalLangSubs = subsByLang.reduce((a, b) => a + b._count.id, 0)

  const langColors: Record<string, string> = { javascript: 'bg-yellow-400', python: 'bg-blue-500', java: 'bg-orange-500', cpp: 'bg-violet-500' }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <BarChart2 size={18} className="text-slate-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
          <p className="text-xs text-slate-500">Platform overview · updated live</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/export?type=users"
            download
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <Download size={13} /> Users CSV
          </a>
          <a
            href="/api/admin/export?type=submissions"
            download
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <Download size={13} /> Submissions CSV
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',    value: totalUsers,        sub: `+${newUsers7} this week`,    icon: Users,    color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Submissions',    value: totalSubs,         sub: `+${subs7} this week`,        icon: Code2,    color: 'text-violet-600',  bg: 'bg-violet-50' },
          { label: 'Enrollments',    value: totalEnrollments,  sub: `+${enrollments7} this week`, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Certificates',   value: totalCerts,        sub: 'all time',                    icon: Award,    color: 'text-amber-600',   bg: 'bg-amber-50' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={17} className={color} />
            </div>
            <div className="text-2xl font-black text-slate-900">{value.toLocaleString()}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">{label}</div>
            <div className="text-xs text-slate-400 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Acceptance + 30d new users */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Acceptance Rate (all-time)', value: `${acceptRate}%`, sub: `${acceptedAll.toLocaleString()} accepted of ${totalSubs.toLocaleString()}` },
          { label: 'Acceptance Rate (7d)',       value: `${acceptRate7}%`, sub: `${accepted7} / ${subs7}` },
          { label: 'New Users (30d)',             value: newUsers30, sub: `${enrollments30} new enrollments` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-5">Activity — last 30 days</h2>
        <AnalyticsChart days={days} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top courses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Top Courses by Enrollment</h2>
          <div className="space-y-3">
            {enrollsByCourse.map(({ title, count }, i) => {
              const pct = Math.round((count / (enrollsByCourse[0]?.count || 1)) * 100)
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 truncate flex-1 mr-2">{title}</span>
                    <span className="font-bold text-slate-900 shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Submissions by Language</h2>
          <div className="space-y-3">
            {subsByLang.map(({ language, _count }) => {
              const pct = totalLangSubs > 0 ? Math.round(_count.id / totalLangSubs * 100) : 0
              return (
                <div key={language}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 capitalize">{language}</span>
                    <span className="font-bold text-slate-900">{_count.id.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div className={`h-1.5 ${langColors[language] ?? 'bg-slate-400'} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top solvers */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Top Problem Solvers</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">#</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Student</th>
              <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Solved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topSolvers.map(({ user, solved }, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 text-xs font-bold text-slate-400">#{i + 1}</td>
                <td className="px-6 py-3">
                  <div className="font-medium text-slate-800">{user?.name ?? '—'}</div>
                  <div className="text-xs text-slate-400 font-mono">{user?.email}</div>
                </td>
                <td className="px-6 py-3 text-right font-black text-slate-900">{solved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Onboarding breakdown */}
      {(skillDist.length > 0 || goalDist.length > 0) && (() => {
        const skillLabels: Record<string, string> = { beginner: '🌱 Beginner', intermediate: '🚀 Intermediate', advanced: '⚡ Advanced' }
        const goalLabels:  Record<string, string> = { interviews: '💼 Interviews', courses: '📖 Courses', practice: '💻 Practice', fun: '😊 Fun' }
        const skillTotal = skillDist.reduce((a, b) => a + b._count.id, 0)
        const goalTotal  = goalDist.reduce((a, b) => a + b._count.id, 0)
        const skillColors: Record<string, string> = { beginner: 'bg-emerald-400', intermediate: 'bg-blue-500', advanced: 'bg-violet-500' }
        const goalColors:  Record<string, string> = { interviews: 'bg-amber-400', courses: 'bg-blue-400', practice: 'bg-emerald-500', fun: 'bg-pink-400' }
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Skill Level Distribution</h2>
              <div className="space-y-3">
                {skillDist.sort((a, b) => {
                  const order = ['beginner', 'intermediate', 'advanced']
                  return order.indexOf(a.skillLevel ?? '') - order.indexOf(b.skillLevel ?? '')
                }).map(({ skillLevel, _count }) => {
                  const pct = skillTotal > 0 ? Math.round(_count.id / skillTotal * 100) : 0
                  return (
                    <div key={skillLevel}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{skillLabels[skillLevel ?? ''] ?? skillLevel}</span>
                        <span className="font-bold text-slate-900">{_count.id} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div className={`h-2 ${skillColors[skillLevel ?? ''] ?? 'bg-slate-400'} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <p className="text-xs text-slate-400 pt-1">{skillTotal} users onboarded</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Learning Goal Distribution</h2>
              <div className="space-y-3">
                {goalDist.sort((a, b) => b._count.id - a._count.id).map(({ learningGoal, _count }) => {
                  const pct = goalTotal > 0 ? Math.round(_count.id / goalTotal * 100) : 0
                  return (
                    <div key={learningGoal}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{goalLabels[learningGoal ?? ''] ?? learningGoal}</span>
                        <span className="font-bold text-slate-900">{_count.id} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full">
                        <div className={`h-2 ${goalColors[learningGoal ?? ''] ?? 'bg-slate-400'} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <p className="text-xs text-slate-400 pt-1">{goalTotal} users with goals set</p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
