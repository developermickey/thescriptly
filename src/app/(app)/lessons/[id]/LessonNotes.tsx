'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { StickyNote, Save, Check } from 'lucide-react'

export function LessonNotes({ lessonId }: { lessonId: number }) {
  const [content, setContent]   = useState('')
  const [status, setStatus]     = useState<'idle' | 'saving' | 'saved'>('idle')
  const [loaded, setLoaded]     = useState(false)
  const debounce                = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch(`/api/lessons/notes?lessonId=${lessonId}`)
      .then(r => r.json())
      .then(d => { setContent(d.content ?? ''); setLoaded(true) })
  }, [lessonId])

  const save = useCallback(async (text: string) => {
    setStatus('saving')
    await fetch('/api/lessons/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, content: text }),
    })
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }, [lessonId])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setContent(val)
    setStatus('saving')
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => save(val), 800)
  }

  if (!loaded) return null

  return (
    <div className="mt-8 border-t border-slate-100 pt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <StickyNote size={14} className="text-amber-500" /> My Notes
        </h3>
        <span className={`text-xs font-medium transition-all ${
          status === 'saving' ? 'text-slate-400' :
          status === 'saved'  ? 'text-emerald-600' : 'text-transparent'
        }`}>
          {status === 'saving' ? 'Saving…' : status === 'saved' ? '✓ Saved' : '·'}
        </span>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Jot down key takeaways, questions, or ideas from this lesson…"
        rows={6}
        className="w-full rounded-xl border border-slate-200 bg-amber-50/40 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none transition-all leading-relaxed"
      />
    </div>
  )
}
