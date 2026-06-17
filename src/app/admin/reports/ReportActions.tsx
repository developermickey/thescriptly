'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface Props {
  reportId: number
  currentStatus: string
}

export function ReportActions({ reportId, currentStatus }: Props) {
  const router  = useRouter()
  const [busy, setBusy] = useState(false)

  async function update(status: string) {
    setBusy(true)
    await fetch(`/api/admin/reports/${reportId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    })
    router.refresh()
    setBusy(false)
  }

  return (
    <div className="flex gap-2 shrink-0">
      {currentStatus !== 'resolved' && (
        <button
          onClick={() => update('resolved')}
          disabled={busy}
          title="Mark resolved"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <CheckCircle size={13} /> Resolve
        </button>
      )}
      {currentStatus !== 'dismissed' && (
        <button
          onClick={() => update('dismissed')}
          disabled={busy}
          title="Dismiss"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <XCircle size={13} /> Dismiss
        </button>
      )}
      {currentStatus !== 'open' && (
        <button
          onClick={() => update('open')}
          disabled={busy}
          title="Reopen"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RotateCcw size={13} /> Reopen
        </button>
      )}
    </div>
  )
}
