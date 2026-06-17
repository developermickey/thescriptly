import { prisma } from '@/lib/prisma'
import { EnrollmentsAdmin } from './EnrollmentsAdmin'

export const metadata = { title: 'Enrollments' }

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; page?: string }>
}) {
  const { course: courseIdParam, page: pageParam } = await searchParams
  const courseId = courseIdParam ? parseInt(courseIdParam) : undefined
  const page     = Math.max(1, parseInt(pageParam ?? '1') || 1)
  const perPage  = 50

  const [courses, total, enrollments] = await Promise.all([
    prisma.course.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.enrollment.count({ where: courseId ? { courseId } : undefined }),
    prisma.enrollment.findMany({
      where:   courseId ? { courseId } : undefined,
      orderBy: { id: 'desc' },
      skip:    (page - 1) * perPage,
      take:    perPage,
      select: {
        id: true, enrolledAt: true,
        user:   { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    }),
  ])

  // Per-course enrollment counts for the summary
  const courseCounts = await prisma.enrollment.groupBy({
    by: ['courseId'],
    _count: { id: true },
  })
  const courseCountMap = new Map(courseCounts.map(c => [c.courseId, c._count.id]))

  return (
    <EnrollmentsAdmin
      courses={courses}
      enrollments={enrollments as any}
      courseCountMap={Object.fromEntries(courseCountMap)}
      total={total}
      page={page}
      perPage={perPage}
      selectedCourseId={courseId ?? null}
    />
  )
}
