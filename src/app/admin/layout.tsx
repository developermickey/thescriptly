import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Code2, Users, BookOpen, Code, LayoutDashboard, ChevronRight, BarChart2, FileText, Layers, Bell, ListChecks, UserCheck, Flag, Zap } from 'lucide-react'

const navItems = [
  { href: '/admin',                 label: 'Overview',      icon: LayoutDashboard },
  { href: '/admin/courses',         label: 'Courses',       icon: BookOpen },
  { href: '/admin/modules',         label: 'Modules',       icon: Layers },
  { href: '/admin/lessons',         label: 'Lessons',       icon: FileText },
  { href: '/admin/problems',        label: 'Problems',      icon: Code },
  { href: '/admin/collections',     label: 'Collections',   icon: ListChecks },
  { href: '/admin/daily',           label: 'Daily',         icon: Zap },
  { href: '/admin/users',           label: 'Users',         icon: Users },
  { href: '/admin/enrollments',     label: 'Enrollments',   icon: UserCheck },
  { href: '/admin/reports',         label: 'Reports',       icon: Flag },
  { href: '/admin/notifications',   label: 'Notifications', icon: Bell },
  { href: '/admin/analytics',       label: 'Analytics',     icon: BarChart2 },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const user    = session?.user as any
  if (!session || user?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 fixed top-0 left-0 h-screen flex flex-col z-40">
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code2 size={15} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm block leading-none">Codex</span>
              <span className="text-slate-500 text-xs">Admin</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-4 border-t border-slate-800 pt-3">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
            <ChevronRight size={12} className="rotate-180" /> Back to app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 min-h-screen">{children}</main>
    </div>
  )
}
