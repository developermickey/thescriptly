'use client'
import { useState } from 'react'
import { Layers, Plus, Pencil, Trash2, Check, X, Pin, Search } from 'lucide-react'
import Link from 'next/link'

interface Collection {
  id: number
  slug: string
  title: string
  description: string | null
  icon: string | null
  isPinned: boolean
  items: { questionId: number }[]
  _count: { items: number }
}

interface Problem {
  id: number
  title: string
  difficulty: string
  topic: string | null
}

interface Props {
  collections: Collection[]
  problems: Problem[]
}

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-600 bg-emerald-50',
  Medium: 'text-amber-600 bg-amber-50',
  Hard:   'text-red-500 bg-red-50',
}

export function CollectionsAdmin({ collections: initial, problems }: Props) {
  const [collections, setCollections] = useState(initial)
  const [editing, setEditing]         = useState<Collection | null>(null)
  const [creating, setCreating]       = useState(false)
  const [saving, setSaving]           = useState(false)

  // Form state
  const [title, setTitle]       = useState('')
  const [desc,  setDesc]        = useState('')
  const [icon,  setIcon]        = useState('📚')
  const [pinned, setPinned]     = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [pSearch, setPSearch]   = useState('')

  function openCreate() {
    setTitle(''); setDesc(''); setIcon('📚'); setPinned(false); setSelected(new Set()); setPSearch('')
    setEditing(null); setCreating(true)
  }

  function openEdit(c: Collection) {
    setTitle(c.title); setDesc(c.description ?? ''); setIcon(c.icon ?? '📚'); setPinned(c.isPinned)
    setSelected(new Set(c.items.map(i => i.questionId))); setPSearch('')
    setEditing(c); setCreating(false)
  }

  function toggleQ(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function save() {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const body = { title, description: desc, icon, isPinned: pinned, questionIds: [...selected] }
      let res: Response
      if (editing) {
        res = await fetch('/api/admin/collections', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...body }),
        })
      } else {
        res = await fetch('/api/admin/collections', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      const data = await res.json()
      if (editing) {
        setCollections(prev => prev.map(c => c.id === data.id ? { ...c, ...data, items: [...selected].map(qId => ({ questionId: qId })) } : c))
      } else {
        setCollections(prev => [...prev, { ...data, items: [...selected].map(qId => ({ questionId: qId })) }])
      }
      setEditing(null); setCreating(false)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this collection?')) return
    await fetch('/api/admin/collections', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCollections(prev => prev.filter(c => c.id !== id))
  }

  const filteredProblems = problems.filter(p =>
    !pSearch || p.title.toLowerCase().includes(pSearch.toLowerCase()) || p.topic?.toLowerCase().includes(pSearch.toLowerCase())
  )

  const showForm = creating || editing

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers size={20} className="text-blue-600" /> Problem Collections
          </h1>
          <p className="text-slate-500 text-sm mt-1">{collections.length} collection{collections.length !== 1 ? 's' : ''}</p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={15} /> New Collection
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-5">{editing ? 'Edit Collection' : 'New Collection'}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: metadata */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Icon</label>
                  <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={2}
                    className="w-14 text-center text-2xl border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Top 50 Interview Questions"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="What will users learn from this collection?"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Pin size={13} className="text-amber-500" /> Pin to top
                </span>
              </label>

              <p className="text-xs text-slate-400">{selected.size} problems selected</p>

              <div className="flex gap-2">
                <button onClick={save} disabled={!title.trim() || saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Check size={14} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(null); setCreating(false) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>

            {/* Right: problem picker */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Problems</label>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder="Filter problems…"
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-64 divide-y divide-slate-50">
                {filteredProblems.slice(0, 50).map(p => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleQ(p.id)} className="w-3.5 h-3.5 accent-blue-600 shrink-0" />
                    <span className="flex-1 text-xs font-medium text-slate-800 truncate">{p.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${DIFF_COLOR[p.difficulty] ?? ''}`}>{p.difficulty[0]}</span>
                  </label>
                ))}
                {filteredProblems.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No problems found.</p>
                )}
                {filteredProblems.length > 50 && (
                  <p className="text-xs text-slate-400 text-center py-2">Showing first 50 — refine search to find more.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collections list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {collections.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Layers size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No collections yet. Create one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {collections.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                <span className="text-2xl w-10 text-center shrink-0">{c.icon ?? '📚'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                    {c.isPinned && <Pin size={11} className="text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{c._count.items} problems · <span className="font-mono">/collections/{c.slug}</span></p>
                </div>
                <Link href={`/collections/${c.slug}`} className="text-xs text-blue-600 hover:underline shrink-0">View</Link>
                <button onClick={() => openEdit(c)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(c.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
