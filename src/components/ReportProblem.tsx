'use client'
import { useState } from 'react'
import { Flag, X, AlertCircle, Check } from 'lucide-react'

const TYPES = [
  { value: 'wrong_answer', label: 'Wrong expected answer' },
  { value: 'typo',         label: 'Typo or writing error' },
  { value: 'broken_test',  label: 'Test case is broken' },
  { value: 'other',        label: 'Other issue' },
]

interface Props {
  questionId: number
}

export function ReportProblem({ questionId }: Props) {
  const [open,    setOpen]    = useState(false)
  const [type,    setType]    = useState('wrong_answer')
  const [body,    setBody]    = useState('')
  const [busy,    setBusy]    = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/problems/${questionId}/report`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type, body }),
    })
    const data = await res.json()
    if (res.ok) {
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setBody(''); setType('wrong_answer') }, 2000)
    } else {
      setError(data.error ?? 'Failed to submit report')
    }
    setBusy(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
      >
        <Flag size={12} /> Report issue
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Flag size={15} className="text-red-500" /> Report a Problem
              </h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check size={22} className="text-emerald-600" />
                </div>
                <p className="font-semibold text-slate-800">Report submitted!</p>
                <p className="text-sm text-slate-400 mt-1">Our team will review it shortly.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Issue type</label>
                  <div className="space-y-2">
                    {TYPES.map(t => (
                      <label key={t.value} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="radio"
                          name="type"
                          value={t.value}
                          checked={type === t.value}
                          onChange={() => setType(t.value)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Details</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={4}
                    required
                    minLength={10}
                    placeholder="Describe the issue in detail…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                  >
                    {busy ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : <Flag size={14} />}
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
