import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import { ListDetailClient } from './ListDetailClient'

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

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

  if (!list) notFound()
  if (!list.isPublic && list.userId !== userId) redirect('/lists')

  const isOwner = list.userId === userId

  const solvedSet = new Set<number>()
  if (userId !== -1) {
    const solved = await prisma.submission.findMany({
      where:  { userId, status: 'accepted' },
      distinct: ['questionId'],
      select: { questionId: true },
    })
    solved.forEach(s => solvedSet.add(s.questionId))
  }

  const questions = list.items.map(i => ({
    id:         i.question.id,
    title:      i.question.title,
    difficulty: i.question.difficulty,
    topic:      i.question.topic,
    company:    i.question.company,
    solved:     solvedSet.has(i.question.id),
  }))

  return (
    <ListDetailClient
      listId={list.id}
      name={list.name}
      description={list.description}
      isPublic={list.isPublic}
      isOwner={isOwner}
      questions={questions}
    />
  )
}
