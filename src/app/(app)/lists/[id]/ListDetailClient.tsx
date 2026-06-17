'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ListChecks, ArrowLeft, CheckCircle, Circle, Trash2,
  Globe, Lock, Edit2, Check, X, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface Question {
  id: number; title: string; difficulty: string
  topic: string | null; company: string | null; solved: boolean
}

interface Props {
  listId: number; name: string; description: string | null
  isPublic: boolean; isOwner: boolean; questions: Question[]
}

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50 border-emerald-200',
  Medium: 'text-amber-600  bg-amber-50  border-amber-200',
  Hard:   'text-red-500   bg-red-50    border-red-200',
}

export function ListDetailClient({ listId, name: initialName, description: initialDesc, isPublic: initialPublic, isOwner, questions: initialQuestions }: Props) {
  const router = useRouter()
  const [questions, setQuestions] = useState(initialQuestions)
  const [editing,   setEditing]   = useState(false)
  const [editName,  setEditName]  = useState(initialName)
  const [editDesc,  setEditDesc]  = useState(initialDesc ?? '')
  const [editPub,   setEditPub]   = useState(initialPublic)
  const [listName,  setListName]  = useState(initialName)
  const [listDesc,  setListDesc]  = useState(initialDesc)
  const [listPub,   setListPub]   = useState(initialPublic)
  const [saving,    setSaving]    = useState(false)
  const [removing,  setRemoving]  = useState<number | null>(null)

  const solved = questions.filter(q => q.solved).length
  const pct    = questions.length > 0 ? Math.round((solved / questions.length) * 100) : 0

  async function saveEdit() {
    if (!editName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/lists/${listId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: editName, description: editDesc, isPublic: editPub }),
    })
    if (res.ok) {
      setListName(editName); setListDesc(editDesc || null); setListPub(editPub)
      setEditing(false)
    }
    setSaving(false)
  }

  async function removeQuestion(questionId: number) {
    setRemoving(questionId)
    const res = await fetch(`/api/lists/${listId}/items`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ questionId }),
    })
    if (res.ok) setQuestions(prev => prev.filter(q => q.id !== questionId))
    setRemoving(null)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Back */}
      <Link href="/lists" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={14} /> My Lists
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
        {editing ? (
          <div className="space-y-3">
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full text-lg font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={2}
              placeholder="Description (optional)"
              className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={editPub} onChange={e => setEditPub(e.target.checked)} className="rounded border-slate-300 text-blue-600" />
                Public list
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                  <X size={13} />
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving || !editName.trim()}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Check size={13} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ListChecks size={18} className="text-blue-600 shrink-0" />
                <h1 className="text-xl font-bold text-slate-900 truncate">{listName}</h1>
                {listPub
                  ? <Globe size={14} className="text-emerald-500 shrink-0" />
                  : <Lock size={14} className="text-slate-300 shrink-0" />}
              </div>
              {listDesc && <p className="text-sm text-slate-500 mb-3">{listDesc}</p>}

              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 rounded-full max-w-xs">
                  <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700">{solved}/{questions.length} solved</span>
                <span className="text-xs text-slate-400">({pct}%)</span>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => { setEditing(true); setEditName(listName); setEditDesc(listDesc ?? ''); setEditPub(listPub) }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl transition-colors"
              >
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Problems */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {questions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ListChecks size={36} className="mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-600 mb-1">No problems yet</p>
            <p className="text-sm">Add problems from the{' '}
              <Link href="/problems" className="text-blue-600 hover:underline font-semibold">problems page</Link>.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                <span className="text-xs font-bold text-slate-300 w-6 shrink-0 text-right">{i + 1}</span>
                <div className="shrink-0 text-slate-300">
                  {q.solved
                    ? <CheckCircle size={15} className="text-emerald-500" />
                    : <Circle size={15} className="text-slate-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/problems/${q.id}`}
                    className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate block"
                  >
                    {q.title}
                  </Link>
                  {(q.topic || q.company) && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {[q.topic, q.company].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${DIFF_COLOR[q.difficulty] ?? 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                  {q.difficulty}
                </span>
                <Link
                  href={`/problems/${q.id}`}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all"
                  title="Open problem"
                >
                  <ExternalLink size={13} />
                </Link>
                {isOwner && (
                  <button
                    onClick={() => removeQuestion(q.id)}
                    disabled={removing === q.id}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all disabled:opacity-30"
                    title="Remove from list"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
