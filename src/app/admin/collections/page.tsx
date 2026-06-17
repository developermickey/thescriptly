import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CollectionsAdmin } from './CollectionsAdmin'

export default async function AdminCollectionsPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') redirect('/dashboard')

  const [collections, problems] = await Promise.all([
    prisma.problemCollection.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          select: { questionId: true },
        },
        _count: { select: { items: true } },
      },
    }),
    prisma.practiceQuestion.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, title: true, difficulty: true, topic: true },
    }),
  ])

  return <CollectionsAdmin collections={collections} problems={problems} />
}
