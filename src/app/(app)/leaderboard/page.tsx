import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LeaderboardClient } from './LeaderboardClient'

const DIFF_WEIGHT: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 }

function calcStreak(dates: Date[]): number {
  const days = [...new Set(dates.map(d => d.toISOString().slice(0, 10)))].sort().reverse()
  if (!days.length) return 0
  const today = new Date().toISOString().slice(0, 10)
  const yest  = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yest) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i-1]).getTime() - new Date(days[i]).getTime()) / 86400000
    if (diff === 1) streak++; else break
  }
  return streak
}

async function buildLeaderboard(since?: Date) {
  const where = since ? { status: 'accepted', createdAt: { gte: since } } : { status: 'accepted' }

  // Distinct solved per user (weighted by difficulty)
  const subs = await prisma.submission.findMany({
    where,
    distinct: ['userId', 'questionId'],
    select: { userId: true, question: { select: { difficulty: true } } },
  })

  const scoreMap:  Record<number, number> = {}
  const solvedMap: Record<number, number> = {}
  subs.forEach(s => {
    const w = DIFF_WEIGHT[s.question.difficulty] ?? 1
    scoreMap[s.userId]  = (scoreMap[s.userId]  ?? 0) + w
    solvedMap[s.userId] = (solvedMap[s.userId] ?? 0) + 1
  })

  const leaders = Object.entries(scoreMap)
    .map(([uid, score]) => ({ userId: parseInt(uid), score, solved: solvedMap[parseInt(uid)] ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)

  const userIds = leaders.map(l => l.userId)
  if (userIds.length === 0) return []

  const [users, badges, streakSubs] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
    prisma.userBadge.groupBy({ by: ['userId'], where: { userId: { in: userIds } }, _count: { badgeSlug: true } }),
    prisma.submission.findMany({ where: { userId: { in: userIds } }, select: { userId: true, createdAt: true } }),
  ])

  const userMap  = Object.fromEntries(users.map(u => [u.id, u.name]))
  const badgeMap = Object.fromEntries(badges.map(b => [b.userId, b._count.badgeSlug]))

  const subsByUser: Record<number, Date[]> = {}
  streakSubs.forEach(s => { (subsByUser[s.userId] ??= []).push(s.createdAt) })

  return leaders
    .filter(l => userMap[l.userId])
    .map(l => ({
      userId: l.userId,
      name:   userMap[l.userId],
      score:  l.score,
      solved: l.solved,
      streak: calcStreak(subsByUser[l.userId] ?? []),
      badges: badgeMap[l.userId] ?? 0,
    }))
}

async function buildStreakLeaderboard() {
  const users = await prisma.user.findMany({
    where: { currentStreak: { gt: 0 } },
    select: { id: true, name: true, currentStreak: true, longestStreak: true },
    orderBy: { currentStreak: 'desc' },
    take: 50,
  })
  const badgeCounts = await prisma.userBadge.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map(u => u.id) } },
    _count: { badgeSlug: true },
  })
  const badgeMap = Object.fromEntries(badgeCounts.map(b => [b.userId, b._count.badgeSlug]))
  return users.map(u => ({
    userId: u.id,
    name:   u.name,
    score:  u.currentStreak,
    solved: u.longestStreak,
    streak: u.currentStreak,
    badges: badgeMap[u.id] ?? 0,
  }))
}

async function buildCoursesLeaderboard() {
  const certs = await prisma.certificate.groupBy({
    by: ['userId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 50,
  })
  const userIds = certs.map(c => c.userId)
  if (userIds.length === 0) return []
  const [users, badgeCounts] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, currentStreak: true } }),
    prisma.userBadge.groupBy({ by: ['userId'], where: { userId: { in: userIds } }, _count: { badgeSlug: true } }),
  ])
  const userMap  = Object.fromEntries(users.map(u => [u.id, u]))
  const badgeMap = Object.fromEntries(badgeCounts.map(b => [b.userId, b._count.badgeSlug]))
  return certs.map(c => ({
    userId: c.userId,
    name:   userMap[c.userId]?.name ?? 'Unknown',
    score:  c._count.id,
    solved: c._count.id,
    streak: userMap[c.userId]?.currentStreak ?? 0,
    badges: badgeMap[c.userId] ?? 0,
  }))
}

export default async function LeaderboardPage() {
  const session       = await getServerSession(authOptions)
  const rawId         = parseInt((session?.user as any)?.id)
  const currentUserId = isNaN(rawId) ? -1 : rawId

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [allTime, weekly, streaks, courses] = await Promise.all([
    buildLeaderboard(),
    buildLeaderboard(weekAgo),
    buildStreakLeaderboard(),
    buildCoursesLeaderboard(),
  ])

  return (
    <LeaderboardClient
      allTime={allTime}
      weekly={weekly}
      streaks={streaks}
      courses={courses}
      currentUserId={currentUserId}
    />
  )
}
