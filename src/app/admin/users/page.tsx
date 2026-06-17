import { prisma } from '@/lib/prisma'
import { Users } from 'lucide-react'
import { UsersClient } from './UsersClient'

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { enrollments: true, submissions: true, certificates: true } },
    },
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users size={20} className="text-blue-600" /> Users
        </h1>
        <p className="text-slate-500 text-sm mt-1">{users.length} total users registered.</p>
      </div>

      <UsersClient initialUsers={users as any} />
    </div>
  )
}
