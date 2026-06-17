'use client'
import { useState } from 'react'
import { GripVertical, Pencil, Trash2, Plus, Check, X, BookOpen, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Module {
  id: number
  title: string
  sortOrder: number
  _count: { lessons: number }
}

interface Course { id: number; title: string }

interface Props {
  courses: Course[]
  initialCourseId?: number
}

const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

export function ModulesAdmin({ courses, initialCourseId }: Props) {
  const [courseId, setCourseId] = useState<number | null>(initialCourseId ?? null)
  const [modules, setModules]   = useState<Module[]>([])
  const [loading, setLoading]   = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding]     = useState(false)
  const [editId, setEditId]     = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [error, setError]       = useState('')

  async function loadModules(cId: number) {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/modules?courseId=${cId}`)
    const data = await res.json()
    setModules(data)
    setLoading(false)
  }

  async function handleCourseChange(cId: number) {
    setCourseId(cId)
    setEditId(null)
    setError('')
    if (cId) loadModules(cId)
    else setModules([])
  }

  async function addModule() {
    if (!newTitle.trim() || !courseId) return
    setAdding(true)
    const res = await fetch('/api/admin/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, title: newTitle.trim() }),
    })
    const mod = await res.json()
    setModules(m => [...m, mod])
    setNewTitle('')
    setAdding(false)
  }

  async function saveEdit(id: number) {
    if (!editTitle.trim()) return
    await fetch('/api/admin/modules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title: editTitle.trim() }),
    })
    setModules(m => m.map(mod => mod.id === id ? { ...mod, title: editTitle.trim() } : mod))
    setEditId(null)
  }

  async function deleteModule(id: number) {
    if (!confirm('Delete this module? It must have no lessons.')) return
    const res = await fetch('/api/admin/modules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setModules(m => m.filter(mod => mod.id !== id))
  }

  async function move(index: number, dir: -1 | 1) {
    const next = index + dir
    if (next < 0 || next >= modules.length) return
    const updated = [...modules]
    ;[updated[index], updated[next]] = [updated[next], updated[index]]
    // Assign new sortOrders based on positions
    const reordered = updated.map((m, i) => ({ ...m, sortOrder: i }))
    setModules(reordered)
    // Persist all sort orders
    await Promise.all(reordered.map(m =>
      fetch('/api/admin/modules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, sortOrder: m.sortOrder }),
      })
    ))
  }

  const selectedCourse = courses.find(c => c.id === courseId)

  return (
    <div>
      {/* Course picker */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-500 mb-1">Select Course</label>
        <select
          value={courseId ?? ''}
          onChange={e => handleCourseChange(parseInt(e.target.value) || 0)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-64"
        >
          <option value="">— choose a course —</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {!courseId && (
        <div className="text-center py-20 text-slate-400">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a course to manage its modules.</p>
        </div>
      )}

      {courseId && loading && (
        <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
      )}

      {courseId && !loading && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">{selectedCourse?.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{modules.length} module{modules.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              href={`/admin/lessons?course=${courseId}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage lessons <ChevronRight size={12} />
            </Link>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Module list */}
          <div className="space-y-2 mb-4">
            {modules.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                No modules yet. Add one below.
              </div>
            )}
            {modules.map((mod, i) => (
              <div key={mod.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 group">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors"
                  >
                    <GripVertical size={14} className="rotate-90 -mb-1" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === modules.length - 1}
                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-0 transition-colors"
                  >
                    <GripVertical size={14} className="rotate-90" />
                  </button>
                </div>

                {/* Index */}
                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {i + 1}
                </span>

                {/* Title / Edit */}
                {editId === mod.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(mod.id); if (e.key === 'Escape') setEditId(null) }}
                    className="flex-1 rounded-lg border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span className="flex-1 text-sm font-semibold text-slate-800">{mod.title}</span>
                )}

                {/* Lesson count */}
                <span className="text-xs text-slate-400 shrink-0">
                  {mod._count.lessons} lesson{mod._count.lessons !== 1 ? 's' : ''}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {editId === mod.id ? (
                    <>
                      <button onClick={() => saveEdit(mod.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditId(mod.id); setEditTitle(mod.title) }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteModule(mod.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add module */}
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addModule()}
              placeholder="New module title…"
              className={inputCls}
            />
            <button
              onClick={addModule}
              disabled={adding || !newTitle.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-50 shrink-0"
            >
              <Plus size={14} /> {adding ? 'Adding…' : 'Add Module'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
