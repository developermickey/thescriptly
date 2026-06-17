import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NotificationsClient } from './NotificationsClient'

export const metadata = { title: 'Notifications · Codex' }

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = parseInt((session.user as any).id)

  const notifs = await prisma.notification.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    100,
    select: {
      id: true, type: true, message: true, readAt: true,
      createdAt: true, contentId: true, contentType: true,
    },
  })

  return <NotificationsClient notifs={notifs as any} />
}
