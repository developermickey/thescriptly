import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWeeklyDigestEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const appUrl  = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Get all active users (had activity in past 30 days)
  const activeUsers = await prisma.user.findMany({
    where: {
      role:        { not: 'admin' },
      emailDigest: true,
      submissions: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
    },
    select: { id: true, name: true, email: true, currentStreak: true },
  })

  let sent = 0
  let errors = 0

  for (const user of activeUsers) {
    try {
      const [weekSubs, weekLessons, weekBadges, lastSub] = await Promise.all([
        prisma.submission.count({
          where: { userId: user.id, status: 'accepted', createdAt: { gte: weekAgo } },
        }),
        prisma.lessonProgress.count({
          where: { userId: user.id, completedAt: { gte: weekAgo } },
        }),
        prisma.userBadge.findMany({
          where:  { userId: user.id, awardedAt: { gte: weekAgo } },
          select: { badgeName: true },
        }),
        prisma.submission.findFirst({
          where:   { userId: user.id, status: 'accepted', createdAt: { gte: weekAgo } },
          orderBy: { createdAt: 'desc' },
          include: { question: { select: { title: true } } },
        }),
      ])

      // Skip users with zero activity this week
      if (weekSubs === 0 && weekLessons === 0) continue

      await sendWeeklyDigestEmail(user.email, user.name, {
        problemsSolved:   weekSubs,
        lessonsCompleted: weekLessons,
        currentStreak:    user.currentStreak,
        newBadges:        weekBadges.map(b => b.badgeName),
        topProblem:       lastSub?.question.title ?? null,
      }, appUrl)

      sent++
    } catch {
      errors++
    }
  }

  return NextResponse.json({ sent, errors, total: activeUsers.length })
}
