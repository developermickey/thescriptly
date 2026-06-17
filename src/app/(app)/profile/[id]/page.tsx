import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Code2, Trophy, Flame, BookOpen, Award, Calendar, CheckCircle, Target, GitFork, Globe, AtSign } from 'lucide-react'
import Link from 'next/link'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id: parseInt(id) }, select: { name: true } })
  return user ? { title: `${user.name}'s Profile` } : {}
}

const diffColors: Record<string, string> = {
  Easy:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Hard:   'bg-red-100 text-red-700 border-red-200',
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }    = await params
  const profileId = parseInt(id)
  if (isNaN(profileId)) notFound()

  const session   = await getServerSession(authOptions)
  const isOwn     = parseInt((session?.user as any)?.id) === profileId

  const user = await prisma.user.findUnique({
    where:  { id: profileId },
    select: {
      id: true, name: true, avatar: true, createdAt: true,
      currentStreak: true, longestStreak: true,
      bio: true, github: true, twitter: true, website: true,
      badges:       { select: { badgeSlug: true, badgeName: true, badgeDesc: true, awardedAt: true } },
      certificates: {
        select: { certificateCode: true, completionDate: true, course: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      },
      enrollments: { select: { courseId: true } },
    },
  })
  if (!user) notFound()

  const [solvedStats, totalProblems, recentSolvedRaw, activitySubs] = await Promise.all([
    prisma.submission.groupBy({
      by: ['questionId'],
      where: { userId: profileId, status: 'accepted' },
    }).then(async rows => {
      const ids = rows.map(r => r.questionId)
      const qs  = await prisma.practiceQuestion.findMany({
        where:  { id: { in: ids } },
        select: { difficulty: true },
      })
      const byDiff = { Easy: 0, Medium: 0, Hard: 0 }
      qs.forEach(q => { byDiff[q.difficulty as keyof typeof byDiff] = (byDiff[q.difficulty as keyof typeof byDiff] || 0) + 1 })
      return { total: ids.length, ...byDiff }
    }),
    prisma.practiceQuestion.count(),
    prisma.submission.findMany({
      where:   { userId: profileId, status: 'accepted' },
      orderBy: { createdAt: 'desc' },
      take:    6,
      select:  { question: { select: { id: true, title: true, difficulty: true } }, createdAt: true },
      distinct: ['questionId'],
    }),
    prisma.submission.findMany({
      where:   { userId: profileId, createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } },
      select:  { createdAt: true },
    }),
  ])

  const heatmapData: Record<string, number> = {}
  activitySubs.forEach(s => {
    const key = s.createdAt.toISOString().slice(0, 10)
    heatmapData[key] = (heatmapData[key] ?? 0) + 1
  })

  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 pt-10 pb-16 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shrink-0">
            {user.name[0].toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Calendar size={13} /> Joined {joinedDate}</span>
              {user.currentStreak > 0 && (
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Flame size={13} /> {user.currentStreak} day streak
                </span>
              )}
              {user.github && (
                <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  <GitFork size={13} /> {user.github}
                </a>
              )}
              {user.twitter && (
                <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  <AtSign size={13} /> @{user.twitter}
                </a>
              )}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  <Globe size={13} /> {user.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
            {user.bio && (
              <p className="text-sm text-white/70 mt-3 max-w-lg text-center sm:text-left leading-relaxed">{user.bio}</p>
            )}
          </div>
          {isOwn && (
            <Link href="/settings" className="sm:ml-auto px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors">
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Problems Solved', value: solvedStats.total, icon: Code2,   color: 'text-blue-600',    bg: 'bg-blue-50' },
            { label: 'Courses',         value: user.enrollments.length, icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Certificates',    value: user.certificates.length, icon: Award,    color: 'text-amber-600',  bg: 'bg-amber-50' },
            { label: 'Longest Streak',  value: `${user.longestStreak}d`, icon: Flame,    color: 'text-rose-600',   bg: 'bg-rose-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={17} className={color} />
              </div>
              <div className="text-2xl font-black text-slate-900">{value}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Problems breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target size={16} className="text-blue-600" /> Problem Solving
          </h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900">{solvedStats.total}</div>
              <div className="text-xs text-slate-500">/ {totalProblems} solved</div>
            </div>
            <div className="flex-1 space-y-2">
              {([['Easy', solvedStats.Easy], ['Medium', solvedStats.Medium], ['Hard', solvedStats.Hard]] as [string, number][]).map(([diff, count]) => (
                <div key={diff} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${diffColors[diff]} w-16 text-center`}>{diff}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${diff === 'Easy' ? 'bg-emerald-500' : diff === 'Medium' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${totalProblems > 0 ? (count / totalProblems) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {recentSolvedRaw.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recently Solved</h3>
              <div className="space-y-2">
                {recentSolvedRaw.map(s => (
                  <Link
                    key={s.question.id}
                    href={`/problems/${s.question.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                    <span className="flex-1 text-sm text-slate-700 group-hover:text-blue-700 transition-colors truncate">{s.question.title}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${diffColors[s.question.difficulty]}`}>{s.question.difficulty}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity heatmap */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" /> Activity
          </h2>
          <ActivityHeatmap data={heatmapData} />
        </div>

        {/* Badges */}
        {user.badges.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" /> Badges ({user.badges.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {user.badges.map(b => (
                <div key={b.badgeSlug} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <span className="text-2xl">{b.badgeSlug === 'first_solve' ? '🎯' : b.badgeSlug === 'streak_7' ? '🔥' : b.badgeSlug === 'solved_10' ? '⚡' : '🏆'}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{b.badgeName}</div>
                    <div className="text-xs text-slate-400">{b.badgeDesc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates */}
        {user.certificates.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award size={16} className="text-blue-600" /> Certificates ({user.certificates.length})
            </h2>
            <div className="space-y-3">
              {user.certificates.map(cert => (
                <Link
                  key={cert.certificateCode}
                  href={`/certificates/${cert.certificateCode}`}
                  className="flex items-center justify-between gap-4 border border-slate-100 rounded-xl px-5 py-3.5 hover:border-blue-300 hover:bg-blue-50/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                      <Award size={15} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{cert.course.title}</div>
                      {cert.completionDate && (
                        <div className="text-xs text-slate-400">
                          Completed {new Date(cert.completionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                  <code className="text-xs font-mono text-slate-400">{cert.certificateCode}</code>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
