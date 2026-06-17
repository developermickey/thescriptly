'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  BookOpen, Code2, LayoutDashboard, Trophy, LogOut, GraduationCap,
  ChevronRight, ChevronDown, Flame, UserCircle, Menu, X, History,
  ShieldCheck, Search, Swords, Bookmark, Star, Settings, TrendingUp,
  Terminal, Map, NotebookPen, MessageSquare, Bell, ListChecks, Tag, Building2, List,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'

interface NavItem { href: string; label: string; icon: React.ElementType }
interface NavGroup { label: string; items: NavItem[]; defaultOpen?: boolean }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    defaultOpen: true,
    items: [
      { href: '/dashboard',   label: 'Dashboard',     icon: LayoutDashboard },
      { href: '/search',      label: 'Search',        icon: Search },
    ],
  },
  {
    label: 'Learn',
    defaultOpen: true,
    items: [
      { href: '/courses',     label: 'Courses',       icon: BookOpen },
      { href: '/roadmap',     label: 'Roadmaps',      icon: Map },
      { href: '/notes',       label: 'My Notes',      icon: NotebookPen },
    ],
  },
  {
    label: 'Practice',
    defaultOpen: true,
    items: [
      { href: '/problems',    label: 'Problems',      icon: Code2 },
      { href: '/playground',  label: 'Playground',    icon: Terminal },
      { href: '/interview',   label: 'Mock Interview', icon: Swords },
      { href: '/topics',       label: 'Topics',        icon: Tag },
      { href: '/companies',    label: 'Companies',     icon: Building2 },
      { href: '/collections',  label: 'Collections',   icon: ListChecks },
      { href: '/lists',        label: 'My Lists',      icon: List },
      { href: '/bookmarks',   label: 'Bookmarks',     icon: Bookmark },
    ],
  },
  {
    label: 'Progress',
    defaultOpen: false,
    items: [
      { href: '/progress',    label: 'Progress',      icon: TrendingUp },
      { href: '/submissions', label: 'Submissions',   icon: History },
      { href: '/leaderboard', label: 'Leaderboard',   icon: Trophy },
    ],
  },
  {
    label: 'Achievements',
    defaultOpen: false,
    items: [
      { href: '/certificates',   label: 'Certificates',   icon: GraduationCap },
      { href: '/badges',         label: 'Badges',         icon: Star },
      { href: '/notifications',  label: 'Notifications',  icon: Bell },
    ],
  },
]

function NavGroup({ group, pathname, onNav }: { group: NavGroup; pathname: string; onNav: () => void }) {
  const hasActive = group.items.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))
  const [open, setOpen] = useState(group.defaultOpen || hasActive)

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
      >
        <span className="flex-1 text-left">{group.label}</span>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </button>
      {open && (
        <div className="space-y-0.5">
          {group.items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onNav}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {active && <ChevronRight size={12} className="opacity-50 shrink-0" />}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any
  const [open, setOpen] = useState(false)
  const [streak, setStreak] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/user/streak').then(r => r.json()).then(d => setStreak(d.streak))
  }, [])

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <Code2 size={18} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight leading-none block">Codex</span>
            <span className="text-slate-500 text-xs">Learn to code</span>
          </div>
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors p-1">
          <X size={18} />
        </button>
      </div>

      {/* ⌘K search trigger */}
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
        className="mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors w-[calc(100%-1.5rem)]"
      >
        <Search size={13} className="shrink-0" />
        <span className="flex-1 text-left text-xs">Search…</span>
        <kbd className="hidden lg:block text-[10px] font-mono bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-slate-400">⌘K</kbd>
      </button>

      {/* Grouped nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin">
        {NAV_GROUPS.map(g => (
          <NavGroup key={g.label} group={g} pathname={pathname} onNav={() => setOpen(false)} />
        ))}
      </nav>

      {/* Streak */}
      {(streak === null || streak > 0) && (
        <div className="px-3 py-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Flame size={14} className="text-orange-400 shrink-0" />
            <span className="text-xs text-orange-300 font-semibold truncate">
              {streak === null ? '…' : `${streak}-day streak 🔥`}
            </span>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3 shrink-0 space-y-0.5">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Account</span>
          <NotificationBell />
        </div>

        {/* Avatar + name */}
        <Link
          href={user?.id ? `/profile/${user.id}` : '/profile'}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </Link>

        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
            pathname === '/settings' ? 'text-white bg-slate-800' : 'text-slate-500 hover:text-white hover:bg-slate-800'
          )}
        >
          <Settings size={14} /> Settings
        </Link>

        {user?.role === 'admin' && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
          >
            <ShieldCheck size={14} /> Admin Panel
          </Link>
        )}

        <ThemeToggle />

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 z-40 hidden lg:flex flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 z-40 flex items-center px-4 gap-3">
        <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white transition-colors p-1">
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Code2 size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-base">Codex</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <Link href={user?.id ? `/profile/${user.id}` : '/profile'}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-slate-900 border-r border-slate-800 z-50 flex flex-col animate-slideIn">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
