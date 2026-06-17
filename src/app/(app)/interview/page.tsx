import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InterviewClient } from './InterviewClient'

export default async function InterviewPage() {
  const session = await getServerSession(authOptions)
  const userId  = parseInt((session?.user as any)?.id)

  // Count per difficulty for the setup form
  const [easy, medium, hard] = await Promise.all([
    prisma.practiceQuestion.count({ where: { difficulty: 'Easy' } }),
    prisma.practiceQuestion.count({ where: { difficulty: 'Medium' } }),
    prisma.practiceQuestion.count({ where: { difficulty: 'Hard' } }),
  ])

  return <InterviewClient counts={{ easy, medium, hard }} userId={userId} />
}
