'use client'
import { useState, useEffect } from 'react'
import { Lightbulb, ChevronDown, Eye } from 'lucide-react'

interface Hint { id: number; body: string; sortOrder: number }

export function ProblemHints({ questionId }: { questionId: number }) {
  const [hints,    setHints]    = useState<Hint[]>([])
  const [revealed, setRevealed] = useState(0) // how many hints shown
  const [open,     setOpen]     = useState(false)

  useEffect(() => {
    fetch(`/api/problems/${questionId}/hints`)
      .then(r => r.json())
      .then(d => Array.isArray(d) && setHints(d))
  }, [questionId])

  if (hints.length === 0) return null

  return (
    <div className="border border-amber-200 bg-amber-50/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
          <Lightbulb size={15} className="text-amber-500" />
          Hints ({hints.length})
        </div>
        <ChevronDown size={15} className={`text-amber-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {hints.slice(0, revealed).map((h, i) => (
            <div key={h.id} className="bg-white border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-xs font-bold text-amber-600 mb-1">Hint {i + 1}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{h.body}</p>
            </div>
          ))}

          {revealed < hints.length && (
            <button
              onClick={() => setRevealed(r => r + 1)}
              className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 px-4 py-2 border border-amber-200 rounded-lg bg-white hover:bg-amber-50 transition-colors w-full justify-center"
            >
              <Eye size={12} />
              {revealed === 0 ? 'Show first hint' : `Show hint ${revealed + 1} of ${hints.length}`}
            </button>
          )}

          {revealed === hints.length && (
            <p className="text-xs text-amber-500 text-center">All hints revealed.</p>
          )}
        </div>
      )}
    </div>
  )
}
