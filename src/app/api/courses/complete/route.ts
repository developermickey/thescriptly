import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendCourseCompletionEmail } from '@/lib/email'

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CODEX-'
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId       = parseInt((session.user as any).id)
  const { courseId } = await req.json()

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (!enrollment) return NextResponse.json({ complete: false, pct: 0 })

  // Count lessons vs completed
  const course = await prisma.course.findUnique({
    where:   { id: courseId },
    include: { modules: { include: { lessons: { select: { id: true } } } } },
  })
  if (!course) return NextResponse.json({ complete: false, pct: 0 })

  const allIds = course.modules.flatMap(m => m.lessons.map(l => l.id))
  const total  = allIds.length
  if (total === 0) return NextResponse.json({ complete: false, pct: 0 })

  const done = await prisma.lessonProgress.count({
    where: { userId, lessonId: { in: allIds } },
  })
  const pct = Math.round((done / total) * 100)

  if (pct < 100) return NextResponse.json({ complete: false, pct, done, total })

  // Issue certificate (idempotent)
  const existing = await prisma.certificate.findFirst({ where: { userId, courseId } })
  if (existing) {
    return NextResponse.json({ complete: true, pct: 100, certCode: existing.certificateCode })
  }

  // Generate unique code
  let certCode = genCode()
  let attempt  = 0
  while (await prisma.certificate.findUnique({ where: { certificateCode: certCode } })) {
    certCode = genCode()
    if (++attempt > 10) break
  }

  await prisma.certificate.create({ data: { userId, courseId, certificateCode: certCode } })

  await prisma.notification.create({
    data: {
      userId,
      actorId:     userId,
      type:        'certificate',
      contentId:   courseId,
      contentType: 'course',
      message:     `🎓 You completed the course and earned certificate ${certCode}!`,
    },
  })

  // Send completion email (fire-and-forget — don't block the response)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
  if (user) {
    const certUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/certificates/${certCode}`
    sendCourseCompletionEmail(user.email, user.name, course.title, certUrl).catch(() => {})
  }

  return NextResponse.json({ complete: true, pct: 100, certCode })
}
