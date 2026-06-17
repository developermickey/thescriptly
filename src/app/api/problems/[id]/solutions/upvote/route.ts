import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { solutionId, upvote } = await req.json() as { solutionId: number; upvote: boolean }

  await prisma.sharedSolution.update({
    where: { id: solutionId },
    data:  { upvotes: { increment: upvote ? 1 : -1 } },
  })

  return NextResponse.json({ ok: true })
}
