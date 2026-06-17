import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const difficulty = req.nextUrl.searchParams.get('difficulty') || 'Medium'
  const topic      = req.nextUrl.searchParams.get('topic') || undefined

  const where: any = { difficulty }
  if (topic && topic !== 'any') where.topic = { contains: topic }

  const count = await prisma.practiceQuestion.count({ where })
  if (count === 0) return NextResponse.json({ error: 'No problems found' }, { status: 404 })

  const skip    = Math.floor(Math.random() * count)
  const problem = await prisma.practiceQuestion.findFirst({
    where,
    skip,
    select: {
      id: true, title: true, difficulty: true, topic: true, company: true,
      problemStatement: true, examples: true, constraints: true,
      hints: true, solutionExplanation: true,
      timeComplexity: true, spaceComplexity: true,
      starterCodeJs: true, starterCodePython: true,
      starterCodeJava: true, starterCodeCpp: true,
    },
  })

  return NextResponse.json(problem)
}
