import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { CommandPalette } from '@/components/CommandPalette'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <CommandPalette />
      {/* Desktop: offset by sidebar width. Mobile: offset by top bar height */}
      <main className="flex-1 min-h-screen lg:ml-64 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
