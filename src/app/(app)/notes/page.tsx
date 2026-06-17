import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NotebookPen, BookOpen, Calendar, Code2, StickyNote } from 'lucide-react'
import Link from 'next/link'
import { Card, CardBody } from '@/components/ui/Card'

export const metadata = { title: 'My Notes · Codex' }

export default async function NotesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = parseInt((session.user as any).id)

  const [lessonNotes, problemNotes] = await Promise.all([
    prisma.lessonNote.findMany({
      where: { userId, content: { not: '' } },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: { select: { title: true, course: { select: { id: true, title: true } } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.problemNote.findMany({
      where:   { userId, content: { not: '' } },
      include: { question: { select: { id: true, title: true, difficulty: true, topic: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  // Group lesson notes by course
  const byCourse: Record<string, { courseId: number; courseTitle: string; items: typeof lessonNotes }> = {}
  lessonNotes.forEach(n => {
    const cid   = String(n.lesson.module.course.id)
    const title = n.lesson.module.course.title
    if (!byCourse[cid]) byCourse[cid] = { courseId: n.lesson.module.course.id, courseTitle: title, items: [] }
    byCourse[cid].items.push(n)
  })

  const totalNotes = lessonNotes.length + problemNotes.length

  const DIFF_COLOR: Record<string, string> = {
    Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
    Medium: 'text-amber-600 bg-amber-50 border-amber-200',
    Hard:   'text-red-500 bg-red-50 border-red-200',
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <NotebookPen size={22} className="text-violet-600" /> My Notes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Notes from lessons and problems · {lessonNotes.length} lesson · {problemNotes.length} problem
          </p>
        </div>
        <span className="text-3xl font-bold text-slate-200">{totalNotes > 0 ? totalNotes : '—'}</span>
      </div>

      {totalNotes === 0 ? (
        <Card>
          <CardBody className="text-center py-20">
            <NotebookPen className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-600 font-bold text-lg">No notes yet</p>
            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
              Open any lesson or problem and use the Notes panel to jot down what you learn.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/courses" className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-violet-700 transition-colors">
                <BookOpen size={15} /> Browse Courses
              </Link>
              <Link href="/problems" className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-200 transition-colors">
                <Code2 size={15} /> Browse Problems
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-10">
          {/* Problem notes */}
          {problemNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0">
                  <StickyNote size={13} />
                </div>
                <h2 className="text-sm font-bold text-slate-700">Problem Notes</h2>
                <span className="text-xs text-slate-400 ml-1">· {problemNotes.length} note{problemNotes.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-3 pl-9">
                {problemNotes.map(note => (
                  <Link key={note.id} href={`/problems/${note.question.id}`} className="block group">
                    <Card className="hover:border-amber-200 hover:shadow-sm transition-all">
                      <CardBody className="py-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${DIFF_COLOR[note.question.difficulty] ?? 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                              {note.question.difficulty}
                            </span>
                            {note.question.topic && (
                              <span className="text-[11px] text-slate-400 font-medium">{note.question.topic}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 mt-0.5">
                            <Calendar size={10} />
                            {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors mb-1.5">
                          {note.question.title}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </CardBody>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Lesson notes grouped by course */}
          {lessonNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <BookOpen size={13} />
                </div>
                <h2 className="text-sm font-bold text-slate-700">Lesson Notes</h2>
                <span className="text-xs text-slate-400 ml-1">· {lessonNotes.length} note{lessonNotes.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-8 pl-9">
                {Object.values(byCourse).map(({ courseId, courseTitle, items }) => (
                  <div key={courseId}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold shrink-0">
                        {courseTitle[0]}
                      </div>
                      <Link href={`/courses/${courseId}`} className="text-xs font-bold text-slate-600 hover:text-violet-600 transition-colors">
                        {courseTitle}
                      </Link>
                      <span className="text-xs text-slate-400">· {items.length} note{items.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="space-y-3 pl-8">
                      {items.map(note => (
                        <Link key={note.id} href={`/lessons/${note.lesson.id}`} className="block group">
                          <Card className="hover:border-violet-200 hover:shadow-sm transition-all">
                            <CardBody className="py-4">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 mb-0.5">{note.lesson.module.title}</p>
                                  <p className="text-sm font-bold text-slate-800 group-hover:text-violet-600 transition-colors">
                                    {note.lesson.title}
                                  </p>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 mt-0.5">
                                  <Calendar size={10} />
                                  {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                                {note.content}
                              </p>
                            </CardBody>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
