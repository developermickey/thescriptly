import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  if (isNaN(userId)) return NextResponse.json({ error: 'Bad userId' }, { status: 400 })

  const { questionId, difficulty, language, durationSecs, elapsedSecs, solved, score, grade } = await req.json()

  const record = await prisma.interviewSession.create({
    data: { userId, questionId, difficulty, language, durationSecs, elapsedSecs, solved, score, grade },
  })
  return NextResponse.json(record)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)
  if (isNaN(userId)) return NextResponse.json([])

  const sessions = await prisma.interviewSession.findMany({
    where: { userId },
    include: { question: { select: { title: true, difficulty: true, topic: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(sessions)
}
