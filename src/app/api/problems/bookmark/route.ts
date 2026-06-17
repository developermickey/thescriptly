import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId    = parseInt((session.user as any).id)
  const { problemId } = await req.json()

  const existing = await prisma.problemBookmark.findUnique({
    where: { userId_problemId: { userId, problemId } },
  })

  if (existing) {
    await prisma.problemBookmark.delete({ where: { id: existing.id } })
    return NextResponse.json({ bookmarked: false })
  }

  await prisma.problemBookmark.create({ data: { userId, problemId } })
  return NextResponse.json({ bookmarked: true })
}
