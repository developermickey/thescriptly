import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([], { status: 401 })
  const userId = parseInt((session.user as any).id)

  const notifs = await prisma.notification.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    100,
    select: {
      id: true, type: true, message: true, readAt: true,
      createdAt: true, contentId: true, contentType: true,
    },
  })

  return NextResponse.json(notifs)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  const body = await req.json()

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data:  { readAt: new Date() },
    })
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId, id: { in: body.ids } },
      data:  { readAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  await prisma.notification.deleteMany({
    where: { userId, readAt: { not: null } },
  })

  return NextResponse.json({ ok: true })
}
