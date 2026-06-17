import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  ArrowLeft, ArrowRight, BookOpen, Clock, CheckCircle,
  Play, Code2, HelpCircle, FileText, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { MarkCompleteButton } from './MarkCompleteButton'
import { LessonDiscussion } from './LessonDiscussion'
import { LessonNotes } from './LessonNotes'
import { LessonSidebar } from './LessonSidebar'
import { LessonContent } from './LessonContent'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const lesson = await prisma.lesson.findUnique({
    where:  { id: parseInt(id) },
    select: { title: true, type: true, module: { select: { title: true, course: { select: { title: true } } } } },
  })
  if (!lesson) return {}
  return {
    title: `${lesson.title} · ${lesson.module.course.title}`,
    description: `${lesson.title} — part of ${lesson.module.title} in the ${lesson.module.course.title} course on Scriptly.`,
  }
}

function toEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
  return url
}

function typeIcon(type: string) {
  switch (type) {
    case 'video': return <Play size={12} className="text-blue-500" />
    case 'quiz':  return <HelpCircle size={12} className="text-amber-500" />
    case 'code':  return <Code2 size={12} className="text-emerald-500" />
    default:      return <FileText size={12} className="text-slate-400" />
  }
}

const typeColors: Record<string, string> = {
  video:   'bg-blue-50 text-blue-600 border-blue-200',
  quiz:    'bg-amber-50 text-amber-600 border-amber-200',
  code:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  reading: 'bg-slate-50 text-slate-600 border-slate-200',
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const session  = await getServerSession(authOptions)
  const { id }   = await params
  const rawId    = parseInt((session?.user as any)?.id)
  const userId   = isNaN(rawId) ? -1 : rawId
  const lessonId = parseInt(id)

  const lesson = await prisma.lesson.findUnique({
    where:   { id: lessonId },
    include: { module: { include: { course: { select: { id: true, title: true } } } } },
  })
  if (!lesson) notFound()

  const courseId = lesson.module.courseId

  const [done, prevLesson, nextLesson, nextModuleLesson, enrollment, allModules, progress] = await Promise.all([
    prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId } } }),
    prisma.lesson.findFirst({
      where: { moduleId: lesson.moduleId, sortOrder: { lt: lesson.sortOrder } },
      orderBy: { sortOrder: 'desc' },
      select: { id: true, title: true },
    }),
    prisma.lesson.findFirst({
      where: { moduleId: lesson.moduleId, sortOrder: { gt: lesson.sortOrder } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true },
    }),
    (async () => {
      const nextMod = await prisma.module.findFirst({
        where: { courseId, sortOrder: { gt: lesson.module.sortOrder } },
        orderBy: { sortOrder: 'asc' },
        select: { id: true },
      })
      if (!nextMod) return null
      return prisma.lesson.findFirst({ where: { moduleId: nextMod.id }, orderBy: { sortOrder: 'asc' }, select: { id: true, title: true } })
    })(),
    prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } }),
    prisma.module.findMany({
      where:   { courseId },
      orderBy: { sortOrder: 'asc' },
      include: { lessons: { orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, duration: true } } },
    }),
    prisma.lessonProgress.findMany({
      where:  { userId, lesson: { module: { courseId } } },
      select: { lessonId: true },
    }),
  ])

  const effectiveNext = nextLesson ?? nextModuleLesson
  const doneIds       = progress.map(p => p.lessonId)
  const enrolled      = !!enrollment
  const isDone        = !!done

  const totalLessons = allModules.reduce((s, m) => s + m.lessons.length, 0)
  const pct          = totalLessons > 0 ? Math.round((doneIds.length / totalLessons) * 100) : 0

  return (
    <div className="h-[calc(100vh-0px)] flex overflow-hidden bg-slate-50">

      {/* ── SIDEBAR ── */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm">
        <LessonSidebar
          modules={allModules as any}
          doneIds={doneIds}
          currentLessonId={lessonId}
          courseId={courseId}
          enrolled={enrolled}
        />
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── STICKY TOP BAR ── */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 shadow-sm z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0 flex-1">
            <Link href={`/courses/${courseId}`} className="hover:text-blue-600 transition-colors font-medium whitespace-nowrap">
              {lesson.module.course.title}
            </Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="text-slate-500 truncate">{lesson.module.title}</span>
            <ChevronRight size={12} className="shrink-0" />
            <span className="text-slate-700 font-semibold truncate">{lesson.title}</span>
          </div>

          {/* Progress pill */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-500">{pct}%</span>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {prevLesson ? (
              <Link href={`/lessons/${prevLesson.id}`} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-all">
                <ArrowLeft size={13} /> Prev
              </Link>
            ) : <div className="w-[62px]" />}

            <MarkCompleteButton lessonId={lessonId} courseId={courseId} done={isDone} nextLessonId={effectiveNext?.id} compact />

            {effectiveNext ? (
              <Link href={`/lessons/${effectiveNext.id}`} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-all">
                Next <ArrowRight size={13} />
              </Link>
            ) : <div className="w-[62px]" />}
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 sm:px-10 xl:px-16 py-8 max-w-5xl animate-fadeIn">

            {/* ── LESSON HEADER ── */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border ${typeColors[lesson.type] ?? typeColors.reading}`}>
                  {typeIcon(lesson.type)} {lesson.type}
                </span>
                {lesson.duration && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} /> {lesson.duration} min read
                  </span>
                )}
                {isDone && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                    <CheckCircle size={12} /> Completed
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
                {lesson.title}
              </h1>

              {lesson.description && (
                <p className="text-slate-500 text-base leading-relaxed mt-2 max-w-3xl">{lesson.description}</p>
              )}

              {/* Divider */}
              <div className="mt-6 h-px bg-gradient-to-r from-blue-200 via-violet-200 to-transparent" />
            </div>

            {/* ── VIDEO ── */}
            {lesson.videoUrl && (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-xl border border-slate-900/10 bg-black">
                <div className="aspect-video">
                  <iframe
                    src={toEmbedUrl(lesson.videoUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* ── LESSON CONTENT ── */}
            {lesson.content ? (
              <div className="mb-8">
                <LessonContent html={lesson.content} />
              </div>
            ) : !lesson.videoUrl ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center mb-8 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={28} className="text-slate-300" />
                </div>
                <p className="font-semibold text-slate-500 text-lg">Content coming soon</p>
                <p className="text-slate-400 text-sm mt-1">This lesson is currently being prepared</p>
              </div>
            ) : null}

            {/* ── NOTES ── */}
            <div className="mb-6">
              <LessonNotes lessonId={lessonId} />
            </div>

            {/* ── DISCUSSION ── */}
            <div className="mb-8">
              <LessonDiscussion lessonId={lessonId} />
            </div>

            {/* ── BOTTOM NAV ── */}
            <div className="border-t border-slate-200 pt-6 flex items-center justify-between gap-4">
              <div className="flex-1">
                {prevLesson && (
                  <Link href={`/lessons/${prevLesson.id}`} className="group flex items-center gap-3 text-left max-w-[240px]">
                    <div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center group-hover:border-blue-300 group-hover:bg-blue-50 transition-all shrink-0">
                      <ArrowLeft size={14} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Previous</p>
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate">{prevLesson.title}</p>
                    </div>
                  </Link>
                )}
              </div>

              <MarkCompleteButton lessonId={lessonId} courseId={courseId} done={isDone} nextLessonId={effectiveNext?.id} />

              <div className="flex-1 flex justify-end">
                {effectiveNext && (
                  <Link href={`/lessons/${effectiveNext.id}`} className="group flex items-center gap-3 text-right max-w-[240px]">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Next</p>
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate">{effectiveNext.title}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center group-hover:border-blue-300 group-hover:bg-blue-50 transition-all shrink-0">
                      <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
