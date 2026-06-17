import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const today  = new Date().toISOString().slice(0, 10)

  // Check for admin-pinned problem first
  let problem: { id: number; title: string; difficulty: string; topic: string | null; company: string | null } | null = null

  const pin = await prisma.dailyPin.findUnique({
    where:   { date: today },
    include: { question: { select: { id: true, title: true, difficulty: true, topic: true, company: true } } },
  })

  if (pin) {
    problem = pin.question
  } else {
    const seed  = today.split('-').reduce((acc, n) => acc + parseInt(n), 0)
    const total = await prisma.practiceQuestion.count()
    if (total === 0) return NextResponse.json({ problem: null })
    const skip = seed % total
    const [q] = await prisma.practiceQuestion.findMany({
      skip,
      take: 1,
      select: { id: true, title: true, difficulty: true, topic: true, company: true },
    })
    problem = q
  }

  if (!problem) return NextResponse.json({ problem: null })

  const solved = await prisma.submission.findFirst({
    where: { userId, questionId: problem.id, status: 'accepted' },
  })

  return NextResponse.json({ problem, solved: !!solved, date: today, pinned: !!pin })
}
