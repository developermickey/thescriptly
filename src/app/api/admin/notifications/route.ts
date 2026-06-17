import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== 'admin') return null
  return user
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, type, targetUserId } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const actorId = parseInt((await getServerSession(authOptions))!.user!.id as string)

  if (targetUserId) {
    // Send to specific user
    await prisma.notification.create({
      data: { userId: parseInt(targetUserId), actorId, type: type || 'system', message: message.trim() },
    })
    return NextResponse.json({ sent: 1 })
  }

  // Broadcast to all users
  const users = await prisma.user.findMany({ select: { id: true } })
  await prisma.notification.createMany({
    data: users.map(u => ({
      userId:  u.id,
      actorId,
      type:    type || 'system',
      message: message.trim(),
    })),
    skipDuplicates: true,
  })

  return NextResponse.json({ sent: users.length })
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Return recent broadcasts (system notifications with unique messages)
  const recent = await prisma.notification.findMany({
    where: { type: { in: ['system', 'announcement'] } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    distinct: ['message'],
    select: { id: true, message: true, type: true, createdAt: true },
  })
  return NextResponse.json(recent)
}
