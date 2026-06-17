import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, User, Mail, Calendar, ShieldCheck, Flame,
  BookOpen, Code2, Trophy, Star, CheckCircle, XCircle,
  Clock, TrendingUp,
} from 'lucide-react'

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600   bg-amber-50   border-amber-200',
  Hard:   'text-red-500     bg-red-50     border-red-200',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id: parseInt(id) }, select: { name: true } })
  return { title: user ? `${user.name} · Admin · Codex` : 'User Not Found' }
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = parseInt(id)
  if (isNaN(userId)) notFound()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      currentStreak: true, longestStreak: true, lastStreakDate: true,
      referralCode: true,
      _count: {
        select: {
          enrollments: true, submissions: true, certificates: true,
        },
      },
    },
  })
  if (!user) notFound()

  const [enrollments, recentSubs, certificates, badges, subStats] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, category: true } },
      },
      orderBy: { id: 'desc' },
    }),

    prisma.submission.findMany({
      where: { userId },
      include: { question: { select: { id: true, title: true, difficulty: true } } },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),

    prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { title: true } } },
      orderBy: { completionDate: 'desc' },
    }),

    prisma.userBadge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
    }),

    // submission breakdown
    prisma.submission.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    }),
  ])

  // Course progress for each enrollment
  const enrollmentProgress = await Promise.all(
    enrollments.map(async enr => {
      const totalLessons = await prisma.lesson.count({
        where: { module: { courseId: enr.courseId } },
      })
      const doneLessons = await prisma.lessonProgress.count({
        where: { userId, lesson: { module: { courseId: enr.courseId } } },
      })
      return { ...enr, totalLessons, doneLessons }
    })
  )

  const totalSubs    = subStats.reduce((a, s) => a + s._count.id, 0)
  const acceptedSubs = subStats.find(s => s.status === 'accepted')?._count.id ?? 0
  const acceptRate   = totalSubs > 0 ? Math.round((acceptedSubs / totalSubs) * 100) : 0
  const uniqueSolved = new Set(recentSubs.filter(s => s.status === 'accepted').map(s => s.questionId)).size

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 font-medium mb-6 transition-colors">
        <ArrowLeft size={14} /> All Users
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            {user.role === 'admin' && (
              <span className="flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck size={11} /> Admin
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-1"><Mail size={13} /> {user.email}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Calendar size={12} /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {user.referralCode && (
            <p className="text-xs text-slate-400 mt-1">Referral code: <span className="font-mono text-slate-600">{user.referralCode}</span></p>
          )}
        </div>
        <Link
          href={`/profile/${user.id}`}
          className="text-xs font-semibold text-blue-600 hover:underline shrink-0"
          target="_blank"
        >
          View public profile →
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Submissions',   value: totalSubs,                icon: Code2,    color: 'text-slate-900' },
          { label: 'Accept Rate',   value: `${acceptRate}%`,         icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Courses',       value: enrollments.length,       icon: BookOpen,  color: 'text-blue-600' },
          { label: 'Certificates',  value: certificates.length,      icon: Trophy,    color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-1">
            <s.icon size={16} className={`${s.color} opacity-60`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-4">
        <Flame size={28} className="text-orange-500 shrink-0" />
        <div>
          <p className="font-bold text-orange-900">Streak</p>
          <p className="text-sm text-orange-700">
            Current: <strong>{user.currentStreak} days</strong> · Longest: <strong>{user.longestStreak} days</strong>
            {user.lastStreakDate && (
              <span className="ml-2 text-orange-500">
                (last active {new Date(user.lastStreakDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent submissions */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Recent Submissions</h2>
          {recentSubs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-400">No submissions yet.</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {recentSubs.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/admin/problems`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${i !== 0 ? 'border-t border-slate-100' : ''}`}
                >
                  {s.status === 'accepted'
                    ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    : <XCircle size={14} className="text-red-400 shrink-0" />}
                  <span className="flex-1 text-sm text-slate-700 truncate">{s.question.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${DIFF_COLOR[s.question.difficulty] || ''}`}>
                    {s.question.difficulty}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Course enrollments */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Enrolled Courses</h2>
          {enrollmentProgress.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-400">Not enrolled in any courses.</div>
          ) : (
            <div className="space-y-2">
              {enrollmentProgress.map(enr => {
                const pct = enr.totalLessons > 0 ? Math.round((enr.doneLessons / enr.totalLessons) * 100) : 0
                const hasCert = certificates.some(c => c.courseId === enr.courseId)
                return (
                  <div key={enr.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Link href={`/admin/courses`} className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate">
                        {enr.course.title}
                      </Link>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasCert && <span className="text-xs font-bold text-amber-600">🏆</span>}
                        <span className="text-xs font-bold text-slate-500">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{enr.doneLessons} / {enr.totalLessons} lessons</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Badges ({badges.length})</h2>
            <div className="grid grid-cols-2 gap-2">
              {badges.map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 px-3 py-2.5 flex items-center gap-2.5">
                  <span className="text-xl">🏅</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{b.badgeName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{b.badgeDesc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Certificates</h2>
            <div className="space-y-2">
              {certificates.map(c => (
                <div key={c.id} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Trophy size={16} className="text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.course.title}</p>
                    <p className="text-xs text-slate-500">
                      {c.completionDate
                        ? new Date(c.completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                  <a
                    href={`/certificates/${c.certificateCode}`}
                    target="_blank"
                    className="text-xs text-blue-600 font-semibold hover:underline shrink-0"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
