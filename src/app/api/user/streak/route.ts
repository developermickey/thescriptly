import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function calcStreak(dates: Date[]): number {
  if (dates.length === 0) return 0
  const days = [...new Set(dates.map(d => d.toISOString().slice(0, 10)))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = (prev.getTime() - curr.getTime()) / 86400000
    if (diff === 1) streak++; else break
  }
  return streak
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ streak: 0 })
  const userId = parseInt((session.user as any).id)

  const [subs, progress] = await Promise.all([
    prisma.submission.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.lessonProgress.findMany({ where: { userId }, select: { completedAt: true } }),
  ])

  const dates = [...subs.map(s => s.createdAt), ...progress.map(p => p.completedAt)]
  return NextResponse.json({ streak: calcStreak(dates) })
}
