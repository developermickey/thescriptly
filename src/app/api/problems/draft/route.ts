import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({})

  const userId     = parseInt((session.user as any).id)
  const challengeId = parseInt(req.nextUrl.searchParams.get('problemId') || '0')
  const language    = req.nextUrl.searchParams.get('language') || 'javascript'

  const draft = await prisma.codeDraft.findUnique({
    where: { userId_challengeId_language: { userId, challengeId, language } },
  })
  return NextResponse.json({ code: draft?.code ?? null })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({})

  const userId = parseInt((session.user as any).id)
  const { problemId, language, code } = await req.json()

  await prisma.codeDraft.upsert({
    where:  { userId_challengeId_language: { userId, challengeId: problemId, language } },
    create: { userId, challengeId: problemId, language, code },
    update: { code },
  })
  return NextResponse.json({ saved: true })
}
