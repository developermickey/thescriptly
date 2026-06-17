import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  const rawId   = parseInt((session?.user as any)?.id)
  const userId  = isNaN(rawId) ? -1 : rawId

  const collections = await prisma.problemCollection.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    include: {
      items: {
        include: { question: { select: { id: true, difficulty: true } } },
      },
    },
  })

  // Get solved question IDs for this user
  const solvedSet = new Set<number>()
  if (userId !== -1) {
    const solved = await prisma.submission.findMany({
      where: { userId, status: 'accepted' },
      distinct: ['questionId'],
      select: { questionId: true },
    })
    solved.forEach(s => solvedSet.add(s.questionId))
  }

  return NextResponse.json(
    collections.map(c => ({
      id:          c.id,
      slug:        c.slug,
      title:       c.title,
      description: c.description,
      icon:        c.icon,
      isPinned:    c.isPinned,
      total:       c.items.length,
      solved:      c.items.filter(i => solvedSet.has(i.questionId)).length,
      easy:        c.items.filter(i => i.question.difficulty === 'Easy').length,
      medium:      c.items.filter(i => i.question.difficulty === 'Medium').length,
      hard:        c.items.filter(i => i.question.difficulty === 'Hard').length,
    }))
  )
}
