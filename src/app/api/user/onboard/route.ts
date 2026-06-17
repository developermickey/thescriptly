import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const { skillLevel, learningGoal } = await req.json() as {
    skillLevel: string
    learningGoal: string
  }

  const validSkill = ['beginner', 'intermediate', 'advanced']
  const validGoal  = ['interviews', 'courses', 'practice', 'fun']

  if (!validSkill.includes(skillLevel) || !validGoal.includes(learningGoal)) {
    return NextResponse.json({ error: 'Invalid values' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: userId },
    data:  { skillLevel, learningGoal, onboardedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
