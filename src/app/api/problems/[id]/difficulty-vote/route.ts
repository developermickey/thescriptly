import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session    = await getServerSession(authOptions)
  const { id }     = await params
  const questionId = parseInt(id)
  const userId     = parseInt((session?.user as any)?.id)

  const [votes, myVote] = await Promise.all([
    prisma.difficultyVote.groupBy({
      by: ['vote'],
      where: { questionId },
      _count: { id: true },
    }),
    isNaN(userId) ? null : prisma.difficultyVote.findUnique({
      where: { questionId_userId: { questionId, userId } },
      select: { vote: true },
    }),
  ])

  const counts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 }
  votes.forEach(v => { counts[v.vote] = v._count.id })

  return NextResponse.json({ counts, myVote: myVote?.vote ?? null })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id }     = await params
  const questionId = parseInt(id)
  const userId     = parseInt((session.user as any).id)
  const { vote }   = await req.json() as { vote: string }

  if (!['Easy', 'Medium', 'Hard'].includes(vote)) {
    return NextResponse.json({ error: 'Invalid vote' }, { status: 400 })
  }

  await prisma.difficultyVote.upsert({
    where:  { questionId_userId: { questionId, userId } },
    update: { vote },
    create: { questionId, userId, vote },
  })

  // Return updated counts
  const votes = await prisma.difficultyVote.groupBy({
    by: ['vote'],
    where: { questionId },
    _count: { id: true },
  })
  const counts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 }
  votes.forEach(v => { counts[v.vote] = v._count.id })

  return NextResponse.json({ counts, myVote: vote })
}
