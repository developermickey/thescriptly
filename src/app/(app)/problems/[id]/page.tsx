import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/Badge'
import { ProblemSolver } from './ProblemSolver'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const q = await prisma.practiceQuestion.findUnique({
    where:  { id: parseInt(id) },
    select: { title: true, difficulty: true, topic: true },
  })
  if (!q) return {}
  return {
    title: q.title,
    description: `${q.difficulty} ${q.topic ? `· ${q.topic} · ` : ''}coding problem on Codex. Practice DSA and ace your interviews.`,
    openGraph: { title: `${q.title} · Codex`, description: `${q.difficulty} problem${q.topic ? ` — ${q.topic}` : ''}` },
  }
}

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const session    = await getServerSession(authOptions)
  const { id }     = await params
  const userId     = parseInt((session?.user as any)?.id)
  const questionId = parseInt(id)

  const [question, lastSub, bookmark] = await Promise.all([
    prisma.practiceQuestion.findUnique({ where: { id: questionId } }),
    prisma.submission.findFirst({
      where: { userId, questionId, status: 'accepted' },
      select: { id: true },
    }),
    prisma.problemBookmark.findUnique({
      where: { userId_problemId: { userId, problemId: questionId } },
    }),
  ])
  if (!question) notFound()

  const solved = !!lastSub

  // Related problems — same topic, different id
  const related = question.topic
    ? await prisma.practiceQuestion.findMany({
        where: { topic: question.topic, id: { not: questionId } },
        select: { id: true, title: true, difficulty: true },
        take: 5,
        orderBy: { id: 'asc' },
      })
    : []

  // Which related problems has the user solved?
  const relatedSolvedSet = related.length > 0
    ? new Set(
        (await prisma.submission.findMany({
          where: { userId, questionId: { in: related.map(r => r.id) }, status: 'accepted' },
          select: { questionId: true },
          distinct: ['questionId'],
        })).map(s => s.questionId)
      )
    : new Set<number>()

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-12 border-b border-slate-200 bg-white flex items-center px-4 gap-4 shrink-0">
        <a href="/problems" className="text-sm text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1">
          ← Problems
        </a>
        <span className="text-slate-300">|</span>
        <span className="text-sm font-semibold text-slate-800 truncate">{question.title}</span>
        <Badge variant="difficulty" difficulty={question.difficulty} className="ml-auto">{question.difficulty}</Badge>
        {solved && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">✓ Solved</span>}
      </div>

      <ProblemSolver
        question={question as any}
        userId={userId}
        initialSolved={solved}
        initialBookmarked={!!bookmark}
        related={related.map(r => ({ ...r, solved: relatedSolvedSet.has(r.id) }))}
      />
    </div>
  )
}
