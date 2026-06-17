'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Pin, Trash2, Check, AlertCircle } from 'lucide-react'

interface Question { id: number; title: string; difficulty: string; topic: string | null }
interface PinEntry  { date: string; question: { id: number; title: string; difficulty: string } }

interface Props {
  questions:    Question[]
  pins:         PinEntry[]
  today:        string
  todayPin:     PinEntry | null
  autoQuestion: Question | null
}

const DIFF_CLS: Record<string, string> = {
  Easy:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Hard:   'bg-red-100 text-red-700 border-red-200',
}

export function DailyPinManager({ questions, pins: initialPins, today, todayPin: initialTodayPin, autoQuestion }: Props) {
  const router = useRouter()
  const [pins,       setPins]       = useState<PinEntry[]>(initialPins)
  const [todayPin,   setTodayPin]   = useState<PinEntry | null>(initialTodayPin)
  const [date,       setDate]       = useState(today)
  const [questionId, setQuestionId] = useState<number | ''>('')
  const [busy,       setBusy]       = useState(false)
  const [msg,        setMsg]        = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function pin() {
    if (!questionId) return
    setBusy(true)
    setMsg(null)
    const res = await fetch('/api/admin/daily', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ date, questionId: Number(questionId) }),
    })
    const data = await res.json()
    if (res.ok) {
      const q = questions.find(q => q.id === Number(questionId))!
      const entry: PinEntry = { date, question: { id: q.id, title: q.title, difficulty: q.difficulty } }
      setPins(prev => [...prev.filter(p => p.date !== date), entry].sort((a, b) => a.date.localeCompare(b.date)))
      if (date === today) setTodayPin(entry)
      setMsg({ type: 'success', text: `Pinned for ${date}` })
      router.refresh()
    } else {
      setMsg({ type: 'error', text: data.error ?? 'Failed' })
    }
    setBusy(false)
  }

  async function unpin(d: string) {
    setBusy(true)
    await fetch('/api/admin/daily', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ date: d }),
    })
    setPins(prev => prev.filter(p => p.date !== d))
    if (d === today) setTodayPin(null)
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Today's challenge preview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap size={15} className="text-amber-500" /> Today ({today})
        </h2>
        {todayPin ? (
          <div className="flex items-center gap-3">
            <Pin size={14} className="text-blue-600 shrink-0" />
            <span className="flex-1 text-sm font-semibold text-slate-800">{todayPin.question.title}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFF_CLS[todayPin.question.difficulty]}`}>
              {todayPin.question.difficulty}
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Pinned</span>
            <button onClick={() => unpin(today)} disabled={busy} className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ) : autoQuestion ? (
          <div className="flex items-center gap-3">
            <Zap size={14} className="text-slate-400 shrink-0" />
            <span className="flex-1 text-sm text-slate-600">{autoQuestion.title}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFF_CLS[autoQuestion.difficulty]}`}>
              {autoQuestion.difficulty}
            </span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">Auto</span>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No problems available.</p>
        )}
      </div>

      {/* Pin form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Pin size={15} className="text-blue-600" /> Pin a Problem
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Problem</label>
            <select
              value={questionId}
              onChange={e => setQuestionId(Number(e.target.value) || '')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select a problem…</option>
              {questions.map(q => (
                <option key={q.id} value={q.id}>
                  [{q.difficulty}] {q.title}{q.topic ? ` — ${q.topic}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 text-sm mt-3 px-4 py-2.5 rounded-xl ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {msg.type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
            {msg.text}
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button
            onClick={pin}
            disabled={busy || !questionId}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
          >
            <Pin size={13} /> Pin Problem
          </button>
        </div>
      </div>

      {/* Upcoming pins */}
      {pins.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">Scheduled Pins ({pins.length})</h2>
          <div className="space-y-2">
            {pins.map(p => (
              <div key={p.date} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs font-mono font-bold text-slate-500 w-24 shrink-0">{p.date}</span>
                <span className="flex-1 text-sm font-medium text-slate-800 truncate">{p.question.title}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFF_CLS[p.question.difficulty]}`}>
                  {p.question.difficulty}
                </span>
                {p.date === today && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">Today</span>
                )}
                <button
                  onClick={() => unpin(p.date)}
                  disabled={busy}
                  className="text-red-400 hover:text-red-600 transition-colors ml-1 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
