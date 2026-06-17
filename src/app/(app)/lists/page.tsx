import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ListChecks } from 'lucide-react'
import { ListsClient } from './ListsClient'

export const metadata = { title: 'My Lists · Codex' }

export default async function ListsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = parseInt((session.user as any).id)

  const lists = await prisma.userList.findMany({
    where:   { userId },
    include: {
      items: {
        include: { question: { select: { difficulty: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // fetch solved IDs for progress
  const solved = await prisma.submission.findMany({
    where:  { userId, status: 'accepted' },
    distinct: ['questionId'],
    select: { questionId: true },
  })
  const solvedSet = new Set(solved.map(s => s.questionId))

  const data = lists.map(l => ({
    id:          l.id,
    name:        l.name,
    description: l.description,
    isPublic:    l.isPublic,
    count:       l.items.length,
    solved:      l.items.filter(i => solvedSet.has(i.questionId)).length,
    easy:        l.items.filter(i => i.question.difficulty === 'Easy').length,
    medium:      l.items.filter(i => i.question.difficulty === 'Medium').length,
    hard:        l.items.filter(i => i.question.difficulty === 'Hard').length,
    updatedAt:   l.updatedAt.toISOString(),
  }))

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks size={22} className="text-blue-600" /> My Lists
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create custom problem lists to organise your practice.
          </p>
        </div>
      </div>
      <ListsClient initialLists={data} />
    </div>
  )
}
