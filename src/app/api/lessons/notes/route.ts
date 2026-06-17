import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId   = parseInt((session.user as any).id)
  const lessonId = parseInt(req.nextUrl.searchParams.get('lessonId') ?? '0')
  if (!lessonId) return NextResponse.json({ content: '' })

  const note = await prisma.lessonNote.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { content: true, updatedAt: true },
  })

  return NextResponse.json({ content: note?.content ?? '', updatedAt: note?.updatedAt ?? null })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId   = parseInt((session.user as any).id)
  const { lessonId, content } = await req.json()

  await prisma.lessonNote.upsert({
    where:  { userId_lessonId: { userId, lessonId } },
    update: { content },
    create: { userId, lessonId, content },
  })

  return NextResponse.json({ ok: true })
}
