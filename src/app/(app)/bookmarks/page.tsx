import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Bookmark, Code2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/Card'

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600   bg-amber-50   border-amber-200',
  Hard:   'text-red-500     bg-red-50     border-red-200',
}

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions)
  const userId  = parseInt((session?.user as any)?.id)

  const bookmarks = await prisma.problemBookmark.findMany({
    where: { userId },
    include: {
      question: {
        select: { id: true, title: true, difficulty: true, topic: true, company: true },
      },
    },
    orderBy: { bookmarkedAt: 'desc' },
  })

  // Check which ones the user has solved
  const questionIds = bookmarks.map(b => b.question.id)
  const solved = questionIds.length > 0
    ? await prisma.submission.findMany({
        where: { userId, questionId: { in: questionIds }, status: 'accepted' },
        select: { questionId: true },
      })
    : []
  const solvedSet = new Set(solved.map(s => s.questionId))

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bookmark size={20} className="text-amber-500" /> Bookmarks
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Problems you&apos;ve saved for later.</p>
        </div>
        <span className="text-3xl font-bold text-slate-200">{bookmarks.length > 0 ? bookmarks.length : '—'}</span>
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardBody className="text-center py-20">
            <Bookmark className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-600 font-bold text-lg">No bookmarks yet</p>
            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
              Click the bookmark icon on any problem to save it here.
            </p>
            <Link href="/problems" className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
              <Code2 size={15} /> Browse Problems
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {bookmarks.map(b => {
            const q       = b.question
            const isSolved = solvedSet.has(q.id)
            return (
              <Link
                key={b.id}
                href={`/problems/${q.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Code2 size={16} className={isSolved ? 'text-emerald-500' : 'text-slate-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{q.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {q.topic && <span className="text-xs text-slate-400">{q.topic}</span>}
                    {isSolved && <span className="text-xs text-emerald-600 font-bold">✓ Solved</span>}
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${DIFF_COLOR[q.difficulty] || ''}`}>
                  {q.difficulty}
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(b.bookmarkedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
