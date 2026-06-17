'use client'
import { useState } from 'react'
import { Mail, Check, AlertCircle } from 'lucide-react'

export function DigestTrigger() {
  const [busy,   setBusy]   = useState(false)
  const [result, setResult] = useState<{ sent: number; errors: number; total: number } | null>(null)
  const [error,  setError]  = useState<string | null>(null)

  async function send() {
    if (!confirm('Send weekly digest to all active users?')) return
    setBusy(true)
    setError(null)
    setResult(null)
    const res  = await fetch('/api/admin/digest', { method: 'POST' })
    const data = await res.json()
    if (res.ok) setResult(data)
    else setError(data.error ?? 'Failed')
    setBusy(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Mail size={15} className="text-violet-600" /> Weekly Digest Email
          </h2>
          <p className="text-xs text-slate-500">
            Sends a personalised weekly summary to every user who had activity in the last 7 days. Users with no activity this week are skipped.
          </p>
        </div>
        <button
          onClick={send}
          disabled={busy}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          {busy ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : <Mail size={14} />}
          {busy ? 'Sending…' : 'Send Digest'}
        </button>
      </div>

      {result && (
        <div className="flex items-center gap-2 text-sm mt-4 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
          <Check size={14} />
          Sent to <strong>{result.sent}</strong> users (skipped {result.total - result.sent} inactive
          {result.errors > 0 ? `, ${result.errors} errors` : ''})
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm mt-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle size={14} /> {error}
        </div>
      )}
    </div>
  )
}
