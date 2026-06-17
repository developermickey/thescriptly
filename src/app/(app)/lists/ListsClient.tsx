'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Lock, Globe, ChevronRight, ListChecks, X } from 'lucide-react'
import Link from 'next/link'

interface ListRow {
  id: number; name: string; description: string | null
  isPublic: boolean; count: number; solved: number
  easy: number; medium: number; hard: number; updatedAt: string
}

export function ListsClient({ initialLists }: { initialLists: ListRow[] }) {
  const router = useRouter()
  const [lists,       setLists]       = useState(initialLists)
  const [showCreate,  setShowCreate]  = useState(false)
  const [name,        setName]        = useState('')
  const [desc,        setDesc]        = useState('')
  const [isPublic,    setIsPublic]    = useState(false)
  const [creating,    setCreating]    = useState(false)
  const [error,       setError]       = useState('')
  const [deleting,    setDeleting]    = useState<number | null>(null)

  async function create() {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    const res  = await fetch('/api/lists', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, description: desc, isPublic }),
    })
    const data = await res.json()
    if (res.ok) {
      setLists(prev => [{ ...data, count: 0, solved: 0, easy: 0, medium: 0, hard: 0 }, ...prev])
      setName(''); setDesc(''); setIsPublic(false); setShowCreate(false)
    } else {
      setError(data.error ?? 'Failed to create list')
    }
    setCreating(false)
  }

  async function deleteList(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    const res = await fetch(`/api/lists/${id}`, { method: 'DELETE' })
    if (res.ok) setLists(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      {/* Create button */}
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-sm font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={15} /> New list
        </button>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900">New List</h3>
            <button onClick={() => { setShowCreate(false); setError('') }} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="List name…"
            maxLength={60}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Make public
            </label>
            <div className="flex items-center gap-2">
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                onClick={create}
                disabled={!name.trim() || creating}
                className="text-sm font-bold px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of lists */}
      {lists.length === 0 && !showCreate && (
        <div className="bg-white border border-slate-200 rounded-2xl p-14 text-center shadow-sm">
          <ListChecks size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-base mb-1">No lists yet</p>
          <p className="text-sm text-slate-400 mb-5">Create a list to group problems for focused practice.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={14} /> Create your first list
          </button>
        </div>
      )}

      {lists.map(l => {
        const pct = l.count > 0 ? Math.round((l.solved / l.count) * 100) : 0
        return (
          <div key={l.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/lists/${l.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors truncate">
                    {l.name}
                  </h3>
                  {l.isPublic
                    ? <Globe size={13} className="text-emerald-500 shrink-0" />
                    : <Lock size={13} className="text-slate-300 shrink-0" />}
                </div>
                {l.description && (
                  <p className="text-xs text-slate-500 line-clamp-1 mb-2">{l.description}</p>
                )}
                {/* Difficulty badges */}
                <div className="flex items-center gap-2 text-[11px] font-semibold">
                  {l.easy   > 0 && <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{l.easy}E</span>}
                  {l.medium > 0 && <span className="text-amber-600  bg-amber-50  border border-amber-100  px-2 py-0.5 rounded-full">{l.medium}M</span>}
                  {l.hard   > 0 && <span className="text-red-500   bg-red-50    border border-red-100    px-2 py-0.5 rounded-full">{l.hard}H</span>}
                  {l.count  === 0 && <span className="text-slate-400">Empty</span>}
                </div>
              </Link>

              <div className="flex items-center gap-3 shrink-0">
                {/* Progress ring */}
                {l.count > 0 && (
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{l.solved}/{l.count}</p>
                    <p className="text-[10px] text-slate-400">{pct}% done</p>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1">
                      <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <Link
                  href={`/lists/${l.id}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <ChevronRight size={14} />
                </Link>

                <button
                  onClick={() => deleteList(l.id, l.name)}
                  disabled={deleting === l.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
