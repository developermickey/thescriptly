import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const listId = parseInt(id)
  const userId = parseInt((session.user as any).id)
  const { questionId } = await req.json()

  const list = await prisma.userList.findUnique({ where: { id: listId }, select: { userId: true } })
  if (!list || list.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const count = await prisma.userListItem.count({ where: { listId } })
  if (count >= 200) return NextResponse.json({ error: 'List is full (max 200 problems)' }, { status: 400 })

  try {
    await prisma.userListItem.create({ data: { listId, userId, questionId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Already in list' }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const listId   = parseInt(id)
  const userId   = parseInt((session.user as any).id)
  const { questionId } = await req.json()

  const list = await prisma.userList.findUnique({ where: { id: listId }, select: { userId: true } })
  if (!list || list.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.userListItem.deleteMany({ where: { listId, questionId } })
  return NextResponse.json({ success: true })
}
