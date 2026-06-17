'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { StickyNote, Save, Check } from 'lucide-react'

export function ProblemNote({ questionId }: { questionId: number }) {
  const [content,   setContent]   = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [loaded,    setLoaded]    = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    fetch(`/api/problems/${questionId}/note`)
      .then(r => r.json())
      .then(d => {
        setContent(d.content ?? '')
        if (d.updatedAt) setLastSaved(d.updatedAt)
        setLoaded(true)
      })
  }, [questionId])

  const save = useCallback(async (text: string) => {
    setSaveState('saving')
    const res  = await fetch(`/api/problems/${questionId}/note`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: text }),
    })
    const data = await res.json()
    if (res.ok) {
      setSaveState('saved')
      setLastSaved(data.updatedAt)
      setTimeout(() => setSaveState('idle'), 2000)
    } else {
      setSaveState('idle')
    }
  }, [questionId])

  function handleChange(val: string) {
    setContent(val)
    setSaveState('idle')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(val), 1200)
  }

  function fmt(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <StickyNote size={15} className="text-amber-500" />
          My Notes
        </h2>
        <div className="flex items-center gap-2">
          {saveState === 'saving' && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Save size={11} className="animate-pulse" /> Saving…
            </span>
          )}
          {saveState === 'saved' && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Check size={11} /> Saved
            </span>
          )}
          {saveState === 'idle' && lastSaved && (
            <span className="text-xs text-slate-400">Saved {fmt(lastSaved)}</span>
          )}
        </div>
      </div>

      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        disabled={!loaded}
        placeholder={loaded ? 'Jot down your thoughts, approach, or key insights…' : 'Loading…'}
        className="flex-1 min-h-[220px] w-full resize-none rounded-xl border border-slate-200 bg-amber-50/40 px-4 py-3 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 leading-relaxed transition-colors disabled:opacity-50"
      />

      <p className="mt-2 text-[11px] text-slate-400">
        Notes are private and auto-saved as you type.
      </p>
    </div>
  )
}
