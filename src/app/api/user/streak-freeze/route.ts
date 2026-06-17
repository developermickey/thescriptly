import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, streakFreezes: true, lastFreezeUsed: true, lastStreakDate: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.streakFreezes < 1) return NextResponse.json({ error: 'No freezes available' }, { status: 400 })

  // Only allow 1 freeze per 7 days
  if (user.lastFreezeUsed) {
    const daysSinceLast = (Date.now() - user.lastFreezeUsed.getTime()) / 86400000
    if (daysSinceLast < 7) {
      const daysUntilNext = Math.ceil(7 - daysSinceLast)
      return NextResponse.json({ error: `Next freeze available in ${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''}` }, { status: 400 })
    }
  }

  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // Only apply if last streak date was yesterday (streak is at risk today)
  const lastDate = user.lastStreakDate?.toISOString().slice(0, 10)
  if (lastDate !== yesterday) {
    return NextResponse.json({ error: 'Streak freeze can only protect an at-risk streak (solve something today or your last solve was not yesterday)' }, { status: 400 })
  }

  // Backdate lastStreakDate to today so streak calculation sees continuity
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      lastStreakDate: new Date(`${today}T00:00:00.000Z`),
      streakFreezes: { decrement: 1 },
      lastFreezeUsed: new Date(),
    },
    select: { currentStreak: true, streakFreezes: true },
  })

  return NextResponse.json({ success: true, currentStreak: updated.currentStreak, freezesLeft: updated.streakFreezes })
}

// Replenish freeze: give back 1 freeze per completed week (called from cron or manually)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakFreezes: true, lastFreezeUsed: true },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const freezeAvailable = !user.lastFreezeUsed ||
    (Date.now() - user.lastFreezeUsed.getTime()) / 86400000 >= 7

  return NextResponse.json({
    freezesLeft: user.streakFreezes,
    freezeAvailable,
    nextFreezeIn: user.lastFreezeUsed
      ? Math.max(0, Math.ceil(7 - (Date.now() - user.lastFreezeUsed.getTime()) / 86400000))
      : 0,
  })
}
