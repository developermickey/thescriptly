import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'
import { updateStreak } from '@/lib/streak'
import { sendCourseCompletionEmail } from '@/lib/email'

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CODEX-'
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session  = await getServerSession(authOptions)
  if (!session) return NextResponse.redirect(new URL('/login', req.url))

  const { id }   = await params
  const userId   = parseInt((session.user as any).id)
  const lessonId = parseInt(id)

  await prisma.lessonProgress.upsert({
    where:  { userId_lessonId: { userId, lessonId } },
    update: {},
    create: { userId, lessonId },
  })
  await updateStreak(userId)

  // Find the course this lesson belongs to and check completion
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  })

  let certificate: { certificateCode: string | null } | null = null

  if (lesson) {
    const courseId = lesson.module.courseId

    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })

    if (enrolled) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { modules: { include: { lessons: { select: { id: true } } } } },
      })

      if (course) {
        const allIds = course.modules.flatMap(m => m.lessons.map(l => l.id))
        const total  = allIds.length

        if (total > 0) {
          const done = await prisma.lessonProgress.count({
            where: { userId, lessonId: { in: allIds } },
          })

          if (done >= total) {
            const existing = await prisma.certificate.findFirst({ where: { userId, courseId } })
            if (existing) {
              certificate = existing
            } else {
              let certCode = genCode()
              let attempt  = 0
              while (await prisma.certificate.findUnique({ where: { certificateCode: certCode } })) {
                certCode = genCode()
                if (++attempt > 10) break
              }
              certificate = await prisma.certificate.create({
                data: { userId, courseId, certificateCode: certCode, completionDate: new Date() },
              })
              // Send completion email (non-blocking)
              const certUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
              if (certUser) {
                const base    = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
                const certUrl = `${base}/certificates/${certCode}`
                sendCourseCompletionEmail(certUser.email, certUser.name, course.title, certUrl).catch(() => {})
              }
              await prisma.notification.create({
                data: {
                  userId,
                  actorId:     userId,
                  type:        'certificate',
                  contentId:   courseId,
                  contentType: 'course',
                  message:     `🎓 You completed "${course.title}" and earned certificate ${certCode}!`,
                },
              })
            }
          }
        }
      }
    }
  }

  const newBadges = await checkAndAwardBadges(userId)

  return NextResponse.json({
    success: true,
    certificate: certificate ? { code: certificate.certificateCode } : null,
    newBadges: newBadges.map((b: { slug: string; name: string; emoji: string }) => ({
      slug: b.slug, name: b.name, emoji: b.emoji,
    })),
  })
}
