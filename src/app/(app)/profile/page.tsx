import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { User, Mail, Shield, BookOpen, Code2, Trophy, Calendar, Star } from 'lucide-react'
import Link from 'next/link'
import { ProfileForm } from './ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  const userId  = parseInt((session?.user as any)?.id)

  const [user, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true, bio: true, github: true, twitter: true, website: true },
    }),
    Promise.all([
      prisma.enrollment.count({ where: { userId } }),
      prisma.submission.count({ where: { userId, status: 'accepted' } }),
      prisma.certificate.count({ where: { userId } }),
      prisma.submission.count({ where: { userId } }),
      prisma.userBadge.count({ where: { userId } }),
    ]),
  ])

  if (!user) return null

  const [enrolled, solved, certs, totalSubs, badgeCount] = stats
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const statCards = [
    { label: 'Courses Enrolled', value: enrolled,   icon: BookOpen, color: 'text-blue-600',    bg: 'bg-blue-50',    href: '/courses' },
    { label: 'Problems Solved',  value: solved,     icon: Code2,    color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/problems' },
    { label: 'Certificates',     value: certs,      icon: Trophy,   color: 'text-amber-600',   bg: 'bg-amber-50',   href: '/certificates' },
    { label: 'Badges Earned',    value: badgeCount, icon: Star,     color: 'text-violet-600',  bg: 'bg-violet-50',  href: '/badges' },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account and view your progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Avatar + quick info */}
        <div className="space-y-4">
          <Card>
            <CardBody className="text-center py-8">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${user.avatar || 'from-blue-500 to-violet-600'} flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-lg shadow-blue-200`}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
              <Link href={`/u/${user.id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                View public profile →
              </Link>

              <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <Shield size={11} /> {user.role ?? 'student'}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Calendar size={11} /> Joined {joinDate}
              </div>
            </CardBody>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(s => (
              <Link key={s.label} href={s.href}>
                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                  <CardBody className="py-4 text-center px-3">
                    <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                      <s.icon size={16} className={s.color} />
                    </div>
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">{s.label}</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Right — Edit form */}
        <div className="lg:col-span-2 space-y-5">
          <ProfileForm user={{ id: user.id, name: user.name, email: user.email, avatar: user.avatar, bio: user.bio, github: user.github, twitter: user.twitter, website: user.website }} />
        </div>
      </div>
    </div>
  )
}
