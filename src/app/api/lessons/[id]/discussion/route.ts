import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lessonId = parseInt(id)

  const comments = await prisma.lessonDiscussion.findMany({
    where: { lessonId, parentId: null },
    include: {
      user:    { select: { id: true, name: true } },
      replies: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId   = parseInt((session.user as any).id)
  const lessonId = parseInt(id)
  const { body, parentId } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

  const comment = await prisma.lessonDiscussion.create({
    data:    { lessonId, userId, body: body.trim(), parentId: parentId ?? null },
    include: { user: { select: { id: true, name: true } } },
  })

  if (parentId) {
    const parent = await prisma.lessonDiscussion.findUnique({
      where:  { id: parentId },
      select: { userId: true, lesson: { select: { title: true } } },
    })
    if (parent && parent.userId !== userId) {
      const replier = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      prisma.notification.create({
        data: {
          userId:      parent.userId,
          actorId:     userId,
          type:        'comment_reply',
          contentId:   lessonId,
          contentType: 'lesson',
          message:     `${replier?.name ?? 'Someone'} replied to your comment on "${parent.lesson?.title ?? 'a lesson'}"`,
        },
      }).catch(() => {})
    }
  }

  return NextResponse.json(comment)
}
