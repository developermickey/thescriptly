import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ courses: [], problems: [], lessons: [] })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ courses: [], problems: [], lessons: [] })

  const [courses, problems, lessons] = await Promise.all([
    prisma.course.findMany({
      where: {
        OR: [
          { title:       { contains: q } },
          { description: { contains: q } },
          { category:    { contains: q } },
        ],
      },
      select: { id: true, title: true, category: true, description: true },
      take: 6,
    }),
    prisma.practiceQuestion.findMany({
      where: {
        OR: [
          { title:            { contains: q } },
          { topic:            { contains: q } },
          { problemStatement: { contains: q } },
          { company:          { contains: q } },
        ],
      },
      select: { id: true, title: true, difficulty: true, topic: true, company: true },
      take: 10,
    }),
    prisma.lesson.findMany({
      where: {
        OR: [
          { title:       { contains: q } },
          { description: { contains: q } },
          { content:     { contains: q } },
        ],
      },
      select: {
        id: true, title: true, type: true,
        module: { select: { title: true, course: { select: { id: true, title: true } } } },
      },
      take: 6,
    }),
  ])

  return NextResponse.json({ courses, problems, lessons })
}
