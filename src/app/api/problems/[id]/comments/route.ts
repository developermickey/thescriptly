import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'

const commentSelect = {
  id: true, body: true, likes: true, createdAt: true, parentId: true,
  user:    { select: { id: true, name: true, avatar: true } },
  likedBy: { select: { userId: true } },
  replies: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true, body: true, likes: true, createdAt: true, parentId: true,
      user:    { select: { id: true, name: true, avatar: true } },
      likedBy: { select: { userId: true } },
    },
  },
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const questionId = parseInt(id)
  const comments = await prisma.problemComment.findMany({
    where:   { questionId, parentId: null },
    orderBy: { createdAt: 'desc' },
    select:  commentSelect,
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId     = parseInt((session.user as any).id)
  const { id }     = await params
  const questionId = parseInt(id)
  const { body, parentId } = await req.json()
  if (!body || body.trim().length < 2) return NextResponse.json({ error: 'Comment too short' }, { status: 400 })
  if (body.length > 2000) return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 })
  const comment = await prisma.problemComment.create({
    data:   { questionId, userId, body: body.trim(), parentId: parentId ?? null },
    select: { ...commentSelect, id: true },
  })

  // Notify parent comment author on reply (skip self-replies)
  if (parentId) {
    const parent = await prisma.problemComment.findUnique({
      where:  { id: parentId },
      select: { userId: true, question: { select: { title: true } } },
    })
    if (parent && parent.userId !== userId) {
      const replier = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      prisma.notification.create({
        data: {
          userId:      parent.userId,
          actorId:     userId,
          type:        'comment_reply',
          contentId:   questionId,
          contentType: 'problem',
          message:     `${replier?.name ?? 'Someone'} replied to your comment on "${parent.question?.title ?? 'a problem'}"`,
        },
      }).catch(() => {})
    }
  }

  // Award badges for commenting (fire-and-forget)
  checkAndAwardBadges(userId).catch(() => {})

  return NextResponse.json(comment)
}
