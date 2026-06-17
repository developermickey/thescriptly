import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId     = parseInt((session.user as any).id)
  const questionId = parseInt(id)

  const note = await prisma.problemNote.findUnique({
    where: { userId_questionId: { userId, questionId } },
    select: { content: true, updatedAt: true },
  })

  return NextResponse.json({ content: note?.content ?? '', updatedAt: note?.updatedAt ?? null })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId     = parseInt((session.user as any).id)
  const questionId = parseInt(id)
  const { content } = await req.json()

  const note = await prisma.problemNote.upsert({
    where:  { userId_questionId: { userId, questionId } },
    create: { userId, questionId, content: content ?? '' },
    update: { content: content ?? '' },
    select: { content: true, updatedAt: true },
  })

  return NextResponse.json(note)
}
