import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { LessonsAdmin } from './LessonsAdmin'

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>
}) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') redirect('/dashboard')

  const { course: courseParam } = await searchParams
  const courseId = courseParam ? parseInt(courseParam) : undefined

  const [courses, lessons, modules] = await Promise.all([
    prisma.course.findMany({ select: { id: true, title: true }, orderBy: { id: 'asc' } }),
    prisma.lesson.findMany({
      where: courseId ? { module: { courseId } } : {},
      include: { module: { select: { title: true, courseId: true } } },
      orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    }),
    courseId
      ? prisma.module.findMany({ where: { courseId }, select: { id: true, title: true }, orderBy: { sortOrder: 'asc' } })
      : Promise.resolve(undefined),
  ])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" /> Lesson Editor
        </h1>
        <p className="text-slate-500 text-sm mt-1">Edit lesson titles, content, and metadata.</p>
      </div>
      <LessonsAdmin courses={courses} lessons={lessons as any} selectedCourseId={courseId} modules={modules} />
    </div>
  )
}
