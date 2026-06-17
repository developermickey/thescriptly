import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProblemsClient } from './ProblemsClient'

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; company?: string; difficulty?: string; q?: string }>
}) {
  const session = await getServerSession(authOptions)
  const userId  = parseInt((session?.user as any)?.id)
  const sp      = await searchParams

  const [questions, solvedRaw, bookmarkedRaw, submissionStats] = await Promise.all([
    prisma.practiceQuestion.findMany({
      orderBy: [{ topic: 'asc' }, { difficulty: 'asc' }, { id: 'asc' }],
      select: { id: true, title: true, difficulty: true, topic: true, company: true },
    }),
    isNaN(userId) ? Promise.resolve([]) : prisma.submission.findMany({
      where: { userId, status: 'accepted' },
      select: { questionId: true },
      distinct: ['questionId'],
    }),
    isNaN(userId) ? Promise.resolve([]) : prisma.problemBookmark.findMany({
      where: { userId },
      select: { problemId: true },
    }),
    prisma.submission.groupBy({
      by: ['questionId'],
      _count: { id: true },
    }).then(async (totals) => {
      const accepted = await prisma.submission.groupBy({
        by: ['questionId'],
        where: { status: 'accepted' },
        _count: { id: true },
      })
      const acceptedMap = new Map(accepted.map(a => [a.questionId, a._count.id]))
      return new Map(totals.map(t => [
        t.questionId,
        t._count.id > 0 ? Math.round((acceptedMap.get(t.questionId) ?? 0) / t._count.id * 100) : null,
      ]))
    }),
  ])

  const solvedIds     = new Set(solvedRaw.map((s: any) => s.questionId))
  const bookmarkedIds = new Set(bookmarkedRaw.map((b: any) => b.problemId))
  const questionsWithRate = questions.map(q => ({
    ...q,
    acceptanceRate: submissionStats.get(q.id) ?? null,
  }))

  return (
    <ProblemsClient
      questions={questionsWithRate as any}
      solvedIds={[...solvedIds]}
      bookmarkedIds={[...bookmarkedIds]}
      initialTopic={sp.topic ?? 'all'}
      initialCompany={sp.company ?? 'all'}
      initialDifficulty={sp.difficulty ?? 'all'}
      initialSearch={sp.q ?? ''}
    />
  )
}
