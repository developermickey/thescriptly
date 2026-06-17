import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Layers } from 'lucide-react'
import { ModulesAdmin } from './ModulesAdmin'

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>
}) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') redirect('/dashboard')

  const { course } = await searchParams
  const initialCourseId = course ? parseInt(course) : undefined

  const courses = await prisma.course.findMany({
    select: { id: true, title: true },
    orderBy: { id: 'asc' },
  })

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Layers size={20} className="text-blue-600" /> Module Manager
        </h1>
        <p className="text-slate-500 text-sm mt-1">Create, rename, and reorder modules within a course.</p>
      </div>
      <ModulesAdmin courses={courses} initialCourseId={initialCourseId} />
    </div>
  )
}
