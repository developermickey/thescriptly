'use client'
import { useState } from 'react'
import { Send, Check, Megaphone, User, Info, Award, Zap } from 'lucide-react'

interface UserOption { id: number; name: string; email: string }

const TYPE_OPTIONS = [
  { value: 'system',       label: 'System',       icon: Info,     color: 'text-slate-500' },
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: 'text-blue-600' },
  { value: 'badge',        label: 'Badge',        icon: Award,    color: 'text-amber-500' },
]

export function NotificationComposer({ users }: { users: UserOption[] }) {
  const [message,  setMessage]  = useState('')
  const [type,     setType]     = useState('announcement')
  const [target,   setTarget]   = useState('all')      // 'all' | userId string
  const [sending,  setSending]  = useState(false)
  const [result,   setResult]   = useState<{ sent: number } | null>(null)
  const [error,    setError]    = useState('')
  const [history,  setHistory]  = useState<{ id: number; message: string; type: string; createdAt: string }[]>([])
  const [showHist, setShowHist] = useState(false)

  async function send() {
    if (!message.trim()) return
    setSending(true); setError(''); setResult(null)
    const body: Record<string, string> = { message, type }
    if (target !== 'all') body.targetUserId = target
    const res  = await fetch('/api/admin/notifications', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSending(false); return }
    setResult(data)
    setMessage('')
    setSending(false)
    setTimeout(() => setResult(null), 4000)
  }

  async function loadHistory() {
    const res  = await fetch('/api/admin/notifications')
    const data = await res.json()
    setHistory(data)
    setShowHist(true)
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="space-y-6">
      {/* Compose card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Megaphone size={16} className="text-blue-600" /> Compose Notification
        </h2>

        <div className="space-y-4">
          {/* Target */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Send To</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTarget('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  target === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                <Megaphone size={13} /> All Users
              </button>
              <div className="flex-1">
                <select
                  value={target === 'all' ? '' : target}
                  onChange={e => setTarget(e.target.value || 'all')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— or pick a specific user —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    type === t.value
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <t.icon size={12} className={type === t.value ? 'text-white' : t.color} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="Write your notification message here…"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none placeholder-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">{message.length} / 255 chars</p>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          {result && (
            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
              <Check size={14} /> Sent to {result.sent} user{result.sent !== 1 ? 's' : ''} successfully!
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={showHist ? () => setShowHist(false) : loadHistory}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              {showHist ? 'Hide history' : 'View recent broadcasts'}
            </button>
            <button
              onClick={send}
              disabled={sending || !message.trim() || message.length > 255}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm"
            >
              {sending ? (
                <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Sending…</>
              ) : (
                <><Send size={14} /> Send Notification</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      {showHist && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Recent Broadcasts</h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No broadcasts yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map(n => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Megaphone size={11} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1 capitalize">{n.type} · {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
