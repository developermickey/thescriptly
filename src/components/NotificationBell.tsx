'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, X, Award, GraduationCap, Info, CornerDownRight, Megaphone } from 'lucide-react'
import Link from 'next/link'

interface Notif {
  id: number
  type: string
  message: string | null
  readAt: string | null
  createdAt: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  badge:         <Award size={14} className="text-amber-500" />,
  certificate:   <GraduationCap size={14} className="text-blue-500" />,
  comment_reply: <CornerDownRight size={14} className="text-violet-500" />,
  announcement:  <Megaphone size={14} className="text-pink-500" />,
  system:        <Info size={14} className="text-slate-400" />,
}

export function NotificationBell() {
  const [open,   setOpen]   = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.readAt).length

  useEffect(() => {
    function load() {
      fetch('/api/notifications')
        .then(r => r.json())
        .then(d => Array.isArray(d) && setNotifs(d))
    }
    load()
    const timer = setInterval(load, 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markRead(ids: number[]) {
    if (ids.length === 0) return
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setNotifs(prev => prev.map(n => ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n))
  }

  function handleOpen() {
    setOpen(o => !o)
    if (!open) {
      const unreadIds = notifs.filter(n => !n.readAt).map(n => n.id)
      setTimeout(() => markRead(unreadIds), 500)
    }
  }

  function timeAgo(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60)   return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-slate-500" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 transition-colors ${
                    !n.readAt ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] ?? <Info size={14} className="text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-snug">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.readAt && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
            {unread > 0 ? (
              <button
                onClick={() => markRead(notifs.filter(n => !n.readAt).map(n => n.id))}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Mark all as read
              </button>
            ) : <span />}
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-800 font-semibold hover:underline">
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
