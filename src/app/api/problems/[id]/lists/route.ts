import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ listIds: [] })

  const { id } = await params
  const userId     = parseInt((session.user as any).id)
  const questionId = parseInt(id)

  const items = await prisma.userListItem.findMany({
    where:  { userId, questionId },
    select: { listId: true },
  })

  return NextResponse.json({ listIds: items.map(i => i.listId) })
}
