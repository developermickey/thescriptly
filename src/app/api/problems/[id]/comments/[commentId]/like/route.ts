import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId    = parseInt((session.user as any).id)
  const { commentId } = await params
  const cId = parseInt(commentId)

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId: cId, userId } },
  })

  if (existing) {
    // Toggle off
    await prisma.$transaction([
      prisma.commentLike.delete({ where: { commentId_userId: { commentId: cId, userId } } }),
      prisma.problemComment.update({ where: { id: cId }, data: { likes: { decrement: 1 } } }),
    ])
    return NextResponse.json({ liked: false })
  } else {
    await prisma.$transaction([
      prisma.commentLike.create({ data: { commentId: cId, userId } }),
      prisma.problemComment.update({ where: { id: cId }, data: { likes: { increment: 1 } } }),
    ])
    return NextResponse.json({ liked: true })
  }
}
