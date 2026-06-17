import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  const lists = await prisma.userList.findMany({
    where:   { userId },
    include: { items: { select: { questionId: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(lists.map(l => ({
    id:          l.id,
    name:        l.name,
    description: l.description,
    isPublic:    l.isPublic,
    count:       l.items.length,
    createdAt:   l.createdAt,
    updatedAt:   l.updatedAt,
  })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt((session.user as any).id)

  const { name, description, isPublic } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const existing = await prisma.userList.count({ where: { userId } })
  if (existing >= 20) return NextResponse.json({ error: 'Maximum 20 lists allowed' }, { status: 400 })

  const list = await prisma.userList.create({
    data: { userId, name: name.trim(), description: description?.trim() || null, isPublic: !!isPublic },
  })

  return NextResponse.json(list, { status: 201 })
}
