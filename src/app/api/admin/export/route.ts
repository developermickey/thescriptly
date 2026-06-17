import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function toCSV(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escape = (v: string | number | boolean | null | undefined) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  return [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const type = req.nextUrl.searchParams.get('type') ?? 'users'

  let csv = ''
  let filename = ''

  if (type === 'users') {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        currentStreak: true, longestStreak: true, emailDigest: true,
        skillLevel: true, learningGoal: true, onboardedAt: true,
        _count: { select: { submissions: true, enrollments: true, certificates: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    csv = toCSV(
      ['id', 'name', 'email', 'role', 'joined', 'currentStreak', 'longestStreak', 'submissions', 'enrollments', 'certificates', 'skillLevel', 'learningGoal', 'emailDigest', 'onboarded'],
      users.map(u => [
        u.id, u.name, u.email, u.role ?? 'student',
        u.createdAt.toISOString().slice(0, 10),
        u.currentStreak, u.longestStreak,
        u._count.submissions, u._count.enrollments, u._count.certificates,
        u.skillLevel ?? '', u.learningGoal ?? '',
        u.emailDigest, u.onboardedAt ? 'yes' : 'no',
      ])
    )
    filename = `codex-users-${new Date().toISOString().slice(0, 10)}.csv`
  } else if (type === 'submissions') {
    const subs = await prisma.submission.findMany({
      select: {
        id: true, status: true, language: true, runtimeMs: true, createdAt: true,
        user:     { select: { id: true, name: true, email: true } },
        question: { select: { id: true, title: true, difficulty: true, topic: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    csv = toCSV(
      ['id', 'userId', 'userName', 'userEmail', 'questionId', 'questionTitle', 'difficulty', 'topic', 'status', 'language', 'runtimeMs', 'submittedAt'],
      subs.map(s => [
        s.id, s.user.id, s.user.name, s.user.email,
        s.question.id, s.question.title, s.question.difficulty, s.question.topic ?? '',
        s.status, s.language, s.runtimeMs ?? '', s.createdAt.toISOString(),
      ])
    )
    filename = `codex-submissions-${new Date().toISOString().slice(0, 10)}.csv`
  } else {
    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
