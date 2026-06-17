import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { NotificationComposer } from './NotificationComposer'
import { DigestTrigger } from './DigestTrigger'

export default async function AdminNotificationsPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') redirect('/dashboard')

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })

  const stats = await prisma.notification.groupBy({
    by:     ['type'],
    _count: { id: true },
  })

  const totalSent = stats.reduce((s, t) => s + t._count.id, 0)
  const unread    = await prisma.notification.count({ where: { readAt: null } })

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bell size={20} className="text-blue-600" /> Notifications
        </h1>
        <p className="text-slate-500 text-sm mt-1">Broadcast announcements or message individual users.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Sent',  value: totalSent, color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Unread',      value: unread,    color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Users',       value: users.length, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <NotificationComposer users={users} />
      <div className="mt-6">
        <DigestTrigger />
      </div>
    </div>
  )
}
