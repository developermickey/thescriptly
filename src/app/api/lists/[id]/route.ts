import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function ownsOrFail(userId: number, listId: number) {
  const list = await prisma.userList.findUnique({ where: { id: listId }, select: { userId: true } })
  if (!list) return null
  if (list.userId !== userId) return null
  return list
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const listId = parseInt(id)
  const userId = parseInt((session.user as any).id)

  const list = await prisma.userList.findUnique({
    where:   { id: listId },
    include: {
      items: {
        include: { question: { select: { id: true, title: true, difficulty: true, topic: true, company: true } } },
        orderBy: { addedAt: 'asc' },
      },
    },
  })

  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!list.isPublic && list.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(list)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const listId = parseInt(id)
  const userId = parseInt((session.user as any).id)
  if (!await ownsOrFail(userId, listId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, description, isPublic } = await req.json()
  const data: Record<string, unknown> = {}
  if (name        !== undefined) data.name        = name.trim()
  if (description !== undefined) data.description = description?.trim() || null
  if (isPublic    !== undefined) data.isPublic    = !!isPublic

  const list = await prisma.userList.update({ where: { id: listId }, data })
  return NextResponse.json(list)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const listId = parseInt(id)
  const userId = parseInt((session.user as any).id)
  if (!await ownsOrFail(userId, listId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.userList.delete({ where: { id: listId } })
  return NextResponse.json({ success: true })
}
