import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { CourseForm } from './CourseForm'

export default async function AdminCourseFormPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') redirect('/dashboard')

  const { edit } = await searchParams
  const courseId = edit ? parseInt(edit) : null

  const course = courseId
    ? await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true, title: true, description: true, category: true,
          badge: true, icon: true, isFree: true, price: true, mrp: true, whatYouLearn: true,
        },
      })
    : null

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <Link href="/admin/courses" className="hover:text-blue-600 transition-colors">Courses</Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">{course ? 'Edit Course' : 'New Course'}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          {course ? `Edit: ${course.title}` : 'Add New Course'}
        </h1>
      </div>

      <CourseForm course={course as any} />
    </div>
  )
}
