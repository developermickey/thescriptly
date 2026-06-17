import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const courseId = parseInt(id)

  const [agg, count] = await Promise.all([
    prisma.courseRating.aggregate({
      where: { courseId },
      _avg:  { rating: true },
      _count: { rating: true },
    }),
    prisma.courseRating.findMany({
      where: { courseId },
      include: { user: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ])

  // Get current user's rating if logged in
  const session = await getServerSession(authOptions)
  let myRating: { rating: number; review: string | null } | null = null
  if (session) {
    const userId = parseInt((session.user as any).id)
    myRating = await prisma.courseRating.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { rating: true, review: true },
    })
  }

  return NextResponse.json({
    avg:     agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
    count:   agg._count.rating,
    reviews: count,
    myRating,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId   = parseInt((session.user as any).id)
  const { id }   = await params
  const courseId = parseInt(id)

  // Must be enrolled
  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (!enrolled) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

  const { rating, review } = await req.json()
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }

  const record = await prisma.courseRating.upsert({
    where:  { userId_courseId: { userId, courseId } },
    update: { rating, review: review?.trim() || null },
    create: { userId, courseId, rating, review: review?.trim() || null },
  })

  return NextResponse.json(record)
}
