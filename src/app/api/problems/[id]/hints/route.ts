import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — list hints. Uses structured ProblemHint rows; falls back to legacy hints string field.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }     = await params
  const questionId = parseInt(id)

  const [dbHints, question] = await Promise.all([
    prisma.problemHint.findMany({
      where:   { questionId },
      orderBy: { sortOrder: 'asc' },
      select:  { id: true, body: true, sortOrder: true },
    }),
    prisma.practiceQuestion.findUnique({ where: { id: questionId }, select: { hints: true } }),
  ])

  if (dbHints.length > 0) return NextResponse.json(dbHints)

  // Legacy fallback: parse hints string (newline-separated or JSON array)
  if (question?.hints) {
    let parsed: string[] = []
    try {
      parsed = JSON.parse(question.hints)
    } catch {
      parsed = question.hints.split(/\n+/).map(h => h.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean)
    }
    return NextResponse.json(parsed.map((body, i) => ({ id: -(i + 1), body, sortOrder: i })))
  }

  return NextResponse.json([])
}

// POST — admin creates a hint
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id }        = await params
  const questionId    = parseInt(id)
  const { body, sortOrder } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

  const count = await prisma.problemHint.count({ where: { questionId } })
  const hint  = await prisma.problemHint.create({
    data: { questionId, body: body.trim(), sortOrder: sortOrder ?? count },
  })
  return NextResponse.json(hint)
}
