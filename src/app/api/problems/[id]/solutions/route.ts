import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session    = await getServerSession(authOptions)
  const { id }     = await params
  const questionId = parseInt(id)
  const userId     = parseInt((session?.user as any)?.id)

  // Only let users who have solved this problem see solutions
  if (!isNaN(userId)) {
    const hasSolved = await prisma.submission.findFirst({
      where: { userId, questionId, status: 'accepted' },
      select: { id: true },
    })
    if (!hasSolved) {
      return NextResponse.json({ locked: true, solutions: [] })
    }
  } else {
    return NextResponse.json({ locked: true, solutions: [] })
  }

  const solutions = await prisma.sharedSolution.findMany({
    where: { questionId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { upvotes: 'desc' },
    take: 50,
  })

  return NextResponse.json({ locked: false, solutions })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id }     = await params
  const questionId = parseInt(id)
  const userId     = parseInt((session.user as any).id)

  // Must have solved it first
  const hasSolved = await prisma.submission.findFirst({
    where: { userId, questionId, status: 'accepted' },
    select: { id: true },
  })
  if (!hasSolved) return NextResponse.json({ error: 'Solve the problem first' }, { status: 403 })

  const { language, code, title } = await req.json() as { language: string; code: string; title?: string }

  if (!code?.trim()) return NextResponse.json({ error: 'Code is required' }, { status: 400 })

  // One solution per user per problem (upsert)
  const solution = await prisma.sharedSolution.upsert({
    where: { id: (await prisma.sharedSolution.findFirst({ where: { questionId, userId }, select: { id: true } }))?.id ?? 0 },
    update: { language, code, title: title?.trim() ?? '' },
    create: { questionId, userId, language, code, title: title?.trim() ?? '' },
    include: { user: { select: { id: true, name: true } } },
  })

  // Award badges for sharing (fire-and-forget)
  checkAndAwardBadges(userId).catch(() => {})

  return NextResponse.json(solution)
}
