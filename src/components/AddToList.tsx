'use client'
import { useState, useEffect, useRef } from 'react'
import { ListPlus, Check, Loader2, Plus, ChevronDown } from 'lucide-react'

interface UserList { id: number; name: string; hasQuestion: boolean }

export function AddToList({ questionId }: { questionId: number }) {
  const [open,    setOpen]    = useState(false)
  const [lists,   setLists]   = useState<UserList[]>([])
  const [loading, setLoading] = useState(false)
  const [adding,  setAdding]  = useState<number | null>(null)
  const [loaded,  setLoaded]  = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function loadLists() {
    if (loaded) return
    setLoading(true)
    const [listsRes, itemsRes] = await Promise.all([
      fetch('/api/lists'),
      fetch(`/api/problems/${questionId}/lists`),
    ])
    const listsData = await listsRes.json()
    const itemsData = itemsRes.ok ? await itemsRes.json() : { listIds: [] }
    const inListIds = new Set<number>(itemsData.listIds ?? [])
    setLists(listsData.map((l: { id: number; name: string }) => ({ ...l, hasQuestion: inListIds.has(l.id) })))
    setLoaded(true)
    setLoading(false)
  }

  async function toggle(list: UserList) {
    setAdding(list.id)
    const method = list.hasQuestion ? 'DELETE' : 'POST'
    const res = await fetch(`/api/lists/${list.id}/items`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ questionId }),
    })
    if (res.ok) {
      setLists(prev => prev.map(l => l.id === list.id ? { ...l, hasQuestion: !l.hasQuestion } : l))
    }
    setAdding(null)
  }

  const inAnyList = lists.some(l => l.hasQuestion)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(v => !v); loadLists() }}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
          inAnyList
            ? 'border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'
            : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
        title="Add to list"
      >
        <ListPlus size={13} />
        Lists
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-30 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-500">Add to list</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          ) : lists.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-slate-400 mb-2">No lists yet</p>
              <a href="/lists" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 justify-center">
                <Plus size={11} /> Create a list
              </a>
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto">
              {lists.map(l => (
                <button
                  key={l.id}
                  onClick={() => toggle(l)}
                  disabled={adding === l.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    l.hasQuestion ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                  }`}>
                    {l.hasQuestion && <Check size={10} className="text-white" />}
                    {adding === l.id && <Loader2 size={10} className="text-white animate-spin" />}
                  </div>
                  <span className="text-sm text-slate-700 truncate">{l.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 px-4 py-2">
            <a href="/lists" className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
              <Plus size={11} /> Manage lists
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
