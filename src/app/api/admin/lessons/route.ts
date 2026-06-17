import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  return user?.role === 'admin' ? user : null
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const courseId = req.nextUrl.searchParams.get('courseId')
  const where = courseId ? { module: { courseId: parseInt(courseId) } } : {}
  const lessons = await prisma.lesson.findMany({
    where,
    include: { module: { select: { title: true, courseId: true, course: { select: { title: true } } } } },
    orderBy: [{ module: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
  })
  return NextResponse.json(lessons)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { moduleId, title, type } = await req.json()
  if (!moduleId || !title) return NextResponse.json({ error: 'moduleId and title required' }, { status: 400 })

  const last = await prisma.lesson.findFirst({ where: { moduleId }, orderBy: { sortOrder: 'desc' } })
  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title,
      type: type ?? 'reading',
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    include: { module: { select: { title: true, courseId: true } } },
  })
  return NextResponse.json(lesson)
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, title, content, videoUrl, type, duration } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const lesson = await prisma.lesson.update({
    where: { id: parseInt(id) },
    data: {
      ...(title    !== undefined ? { title }                                          : {}),
      ...(content  !== undefined ? { content }                                        : {}),
      ...(videoUrl !== undefined ? { videoUrl }                                       : {}),
      ...(type     !== undefined ? { type }                                           : {}),
      ...(duration !== undefined ? { duration: duration ? parseInt(duration) : null } : {}),
    },
  })
  return NextResponse.json(lesson)
}
