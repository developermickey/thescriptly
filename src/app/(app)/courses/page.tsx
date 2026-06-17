import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CoursesClient } from './CoursesClient'

const gradients = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-600',
  'from-orange-400 to-amber-500',
  'from-emerald-500 to-teal-400',
  'from-pink-500 to-rose-500',
  'from-slate-600 to-slate-800',
  'from-indigo-500 to-blue-600',
  'from-teal-500 to-cyan-600',
]

export default async function CoursesPage() {
  const session = await getServerSession(authOptions)
  const rawId   = parseInt((session?.user as any)?.id)
  const userId  = isNaN(rawId) ? -1 : rawId

  const courses = await prisma.course.findMany({
    include: {
      modules:     { include: { lessons: { select: { id: true } } } },
      enrollments: { where: { userId }, select: { id: true } },
      _count:      { select: { enrollments: true } },
    },
    orderBy: { id: 'asc' },
  })

  const progressMap: Record<number, number> = {}
  await Promise.all(
    courses
      .filter(c => c.enrollments.length > 0)
      .map(async (c, _) => {
        const lessonIds = c.modules.flatMap(m => m.lessons.map(l => l.id))
        const total     = lessonIds.length
        if (total === 0) { progressMap[c.id] = 0; return }
        const done = await prisma.lessonProgress.count({ where: { userId, lessonId: { in: lessonIds } } })
        progressMap[c.id] = Math.round((done / total) * 100)
      })
  )

  const clientCourses = courses.map((course, i) => ({
    id:           course.id,
    title:        course.title,
    description:  course.description,
    category:     course.category,
    isFree:       course.isFree,
    totalLessons: course.modules.reduce((s, m) => s + m.lessons.length, 0),
    enrolled:     course.enrollments.length > 0,
    pct:          course.enrollments.length > 0 ? (progressMap[course.id] ?? 0) : 0,
    gradient:     gradients[i % gradients.length],
    enrollCount:  course._count.enrollments,
  }))

  return <CoursesClient courses={clientCourses} />
}
