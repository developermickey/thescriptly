import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const collection = await prisma.problemCollection.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          question: {
            select: {
              id: true, title: true, difficulty: true, topic: true, company: true,
            },
          },
        },
      },
    },
  })

  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const session = await getServerSession(authOptions)
  const rawId   = parseInt((session?.user as any)?.id)
  const userId  = isNaN(rawId) ? -1 : rawId

  const solvedSet = new Set<number>()
  if (userId !== -1) {
    const solved = await prisma.submission.findMany({
      where: { userId, status: 'accepted' },
      distinct: ['questionId'],
      select: { questionId: true },
    })
    solved.forEach(s => solvedSet.add(s.questionId))
  }

  return NextResponse.json({
    ...collection,
    items: collection.items.map(i => ({
      ...i,
      question: { ...i.question, solved: solvedSet.has(i.questionId) },
    })),
  })
}
