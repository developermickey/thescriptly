import { prisma } from '@/lib/prisma'
import { Users, BookOpen, Code, Trophy, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOverview() {
  const [userCount, courseCount, problemCount, submissionCount, recentUsers, recentSubs] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.practiceQuestion.count(),
    prisma.submission.count(),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.submission.findMany({
      orderBy: { createdAt: 'desc' }, take: 8,
      include: { user: { select: { name: true } }, question: { select: { title: true } } },
    }),
  ])

  const stats = [
    { label: 'Total Users',       value: userCount,       icon: Users,    color: 'text-blue-600',    bg: 'bg-blue-50',    href: '/admin/users' },
    { label: 'Courses',           value: courseCount,     icon: BookOpen, color: 'text-violet-600',  bg: 'bg-violet-50',  href: '/admin/courses' },
    { label: 'Practice Problems', value: problemCount,    icon: Code,     color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/problems' },
    { label: 'Total Submissions', value: submissionCount, icon: Activity, color: 'text-amber-600',   bg: 'bg-amber-50',   href: '/admin' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp size={22} className="text-blue-600" /> Admin Overview
        </h1>
        <p className="text-slate-500 text-sm mt-1">Platform statistics and recent activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow block">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`${s.color} w-5 h-5`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value.toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-blue-600 font-semibold hover:underline">View all →</Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {u.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent submissions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Submissions</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-50">
            {recentSubs.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'accepted' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.question.title}</p>
                  <p className="text-xs text-slate-400">{s.user.name} · {s.language}</p>
                </div>
                <span className={`text-xs font-bold ${s.status === 'accepted' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
