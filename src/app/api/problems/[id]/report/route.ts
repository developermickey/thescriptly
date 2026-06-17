import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_TYPES = ['wrong_answer', 'typo', 'broken_test', 'other']

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id }     = await params
  const questionId = parseInt(id)
  const userId     = parseInt((session.user as any).id)
  if (isNaN(questionId)) return NextResponse.json({ error: 'Invalid problem' }, { status: 400 })

  const { type, body } = await req.json() as { type: string; body: string }
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  if (!body?.trim() || body.trim().length < 10) {
    return NextResponse.json({ error: 'Please provide more details (min 10 chars)' }, { status: 400 })
  }

  await prisma.problemReport.create({
    data: { questionId, userId, type, body: body.trim() },
  })

  return NextResponse.json({ success: true })
}
