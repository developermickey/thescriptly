'use client'
import { useState, useMemo } from 'react'
import {
  Bell, Award, GraduationCap, Info, Megaphone, MessageSquare,
  CheckCheck, Trash2, CornerDownRight, Code2, Snowflake,
} from 'lucide-react'
import Link from 'next/link'

interface Notif {
  id: number
  type: string
  message: string | null
  readAt: string | null
  createdAt: string
  contentId: number | null
  contentType: string | null
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  badge:         { icon: <Award size={15} />,          color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
  certificate:   { icon: <GraduationCap size={15} />,  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
  comment_reply: { icon: <CornerDownRight size={15} />, color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100' },
  announcement:  { icon: <Megaphone size={15} />,       color: 'text-pink-600',    bg: 'bg-pink-50',    border: 'border-pink-100' },
  system:        { icon: <Info size={15} />,            color: 'text-slate-500',   bg: 'bg-slate-100',  border: 'border-slate-200' },
  problem:       { icon: <Code2 size={15} />,           color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  streak_freeze: { icon: <Snowflake size={15} />,       color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-100' },
}

function getMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.system
}

function contentLink(n: Notif): string | null {
  if (!n.contentId || !n.contentType) return null
  if (n.contentType === 'problem') return `/problems/${n.contentId}`
  if (n.contentType === 'lesson')  return `/lessons/${n.contentId}`
  if (n.contentType === 'course')  return `/courses/${n.contentId}`
  return null
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dayLabel(iso: string) {
  const d   = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString())       return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

type Filter = 'all' | 'unread'

export function NotificationsClient({ notifs: initial }: { notifs: Notif[] }) {
  const [notifs,  setNotifs]  = useState(initial)
  const [filter,  setFilter]  = useState<Filter>('all')
  const [marking, setMarking] = useState(false)
  const [clearing, setClearing] = useState(false)

  const unreadCount = notifs.filter(n => !n.readAt).length
  const visible     = useMemo(() => filter === 'unread' ? notifs.filter(n => !n.readAt) : notifs, [notifs, filter])

  // Group by day label
  const grouped = useMemo(() => {
    const g: Record<string, Notif[]> = {}
    for (const n of visible) {
      const key = dayLabel(n.createdAt)
      ;(g[key] ??= []).push(n)
    }
    return g
  }, [visible])

  async function markAllRead() {
    setMarking(true)
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ all: true }),
    })
    setNotifs(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setMarking(false)
  }

  async function markOne(id: number) {
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ids: [id] }),
    })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
  }

  async function clearRead() {
    setClearing(true)
    await fetch('/api/notifications', { method: 'DELETE' })
    setNotifs(prev => prev.filter(n => !n.readAt))
    setClearing(false)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center relative">
            <Bell size={18} className="text-blue-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={marking}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCheck size={13} />
              {marking ? 'Marking…' : 'Mark all read'}
            </button>
          )}
          {notifs.some(n => n.readAt) && (
            <button
              onClick={clearRead}
              disabled={clearing}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={13} />
              {clearing ? 'Clearing…' : 'Clear read'}
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {(['all', 'unread'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
              filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center shadow-sm">
          <Bell size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'unread'
              ? <button onClick={() => setFilter('all')} className="text-blue-600 hover:underline">View all notifications</button>
              : 'Earn badges and complete courses to get notified.'}
          </p>
        </div>
      )}

      {/* Grouped list */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{day}</p>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {items.map(n => {
                const meta = getMeta(n.type)
                const link = contentLink(n)
                const isUnread = !n.readAt

                const inner = (
                  <div
                    className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                      isUnread ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/70'
                    }`}
                    onClick={() => isUnread && markOne(n.id)}
                  >
                    {/* Unread dot */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className={`w-9 h-9 ${meta.bg} border ${meta.border} rounded-xl flex items-center justify-center ${meta.color}`}>
                        {meta.icon}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                          {n.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {isUnread && (
                      <div className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    )}
                  </div>
                )

                return link ? (
                  <Link key={n.id} href={link} className="block cursor-pointer">
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id} className="cursor-default">
                    {inner}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
