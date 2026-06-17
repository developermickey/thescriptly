import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const courseId = parseInt(searchParams.get('courseId') ?? '')
  if (isNaN(courseId)) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const modules = await prisma.module.findMany({
    where: { courseId },
    include: { _count: { select: { lessons: true } } },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(modules)
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { courseId, title } = await req.json()
  if (!courseId || !title) return NextResponse.json({ error: 'courseId and title required' }, { status: 400 })

  const last = await prisma.module.findFirst({ where: { courseId }, orderBy: { sortOrder: 'desc' } })
  const module = await prisma.module.create({
    data: { courseId, title, sortOrder: (last?.sortOrder ?? -1) + 1 },
    include: { _count: { select: { lessons: true } } },
  })
  return NextResponse.json(module)
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, title, sortOrder } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (sortOrder !== undefined) data.sortOrder = sortOrder

  const module = await prisma.module.update({ where: { id }, data })
  return NextResponse.json(module)
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const lessonCount = await prisma.lesson.count({ where: { moduleId: id } })
  if (lessonCount > 0) {
    return NextResponse.json({ error: `Cannot delete: module has ${lessonCount} lesson(s)` }, { status: 409 })
  }

  await prisma.module.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
