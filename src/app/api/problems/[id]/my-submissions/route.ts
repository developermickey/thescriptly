import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([])

  const { id }     = await params
  const userId     = parseInt((session.user as any).id)
  const questionId = parseInt(id)

  if (isNaN(userId) || isNaN(questionId)) return NextResponse.json([])

  const subs = await prisma.submission.findMany({
    where: { userId, questionId },
    select: {
      id: true, status: true, language: true, code: true,
      results: true, runtimeMs: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(subs)
}
