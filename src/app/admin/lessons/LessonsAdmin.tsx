'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ChevronDown, ChevronUp, Check, X, Plus } from 'lucide-react'

interface Lesson {
  id: number
  title: string
  content: string | null
  type: string
  duration: number | null
  module: { title: string; courseId: number }
}

interface Course { id: number; title: string }

interface Props {
  courses: Course[]
  lessons: Lesson[]
  selectedCourseId?: number
  modules?: { id: number; title: string }[]
}

const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function LessonRow({ lesson }: { lesson: Lesson }) {
  const [open, setOpen]       = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [title, setTitle]     = useState(lesson.title)
  const [content, setContent] = useState(lesson.content ?? '')
  const [videoUrl, setVideo]  = useState((lesson as any).videoUrl ?? '')
  const [type, setType]       = useState(lesson.type)
  const [duration, setDur]    = useState(lesson.duration?.toString() ?? '')

  async function save() {
    setSaving(true)
    await fetch('/api/admin/lessons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lesson.id, title, content, videoUrl: videoUrl || null, type, duration }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{lesson.module.title} · {type} {duration ? `· ${duration}min` : ''}</p>
        </div>
        {saved && <Check size={14} className="text-emerald-500 shrink-0" />}
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/50">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
                <option value="reading">Reading</option>
                <option value="video">Video</option>
                <option value="exercise">Exercise</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Duration (min)</label>
              <input type="number" value={duration} onChange={e => setDur(e.target.value)} className={inputCls} placeholder="e.g. 10" />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-bold text-slate-500 mb-1">Video URL <span className="font-normal text-slate-400">(YouTube or Vimeo)</span></label>
              <input value={videoUrl} onChange={e => setVideo(e.target.value)} className={inputCls} placeholder="https://youtu.be/… or https://vimeo.com/…" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Content <span className="font-normal text-slate-400">(HTML supported)</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y leading-relaxed"
              placeholder="<h2>Introduction</h2><p>In this lesson...</p>"
            />
          </div>

          {/* Live preview */}
          {content && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Preview</p>
              <div
                className="prose prose-sm max-w-none p-4 bg-white border border-slate-200 rounded-xl text-slate-700 max-h-48 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50`}
            >
              {saved ? <><Check size={13} /> Saved!</> : saving ? 'Saving…' : <><Save size={13} /> Save Lesson</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function LessonsAdmin({ courses, lessons: initial, selectedCourseId, modules }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [lessons, setLessons] = useState(initial)
  const [newTitle, setNewTitle] = useState('')
  const [newModuleId, setNewModuleId] = useState<string>(modules?.[0]?.id?.toString() ?? '')
  const [adding, setAdding] = useState(false)

  const filtered = lessons.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.module.title.toLowerCase().includes(search.toLowerCase())
  )

  async function addLesson() {
    if (!newTitle.trim() || !newModuleId) return
    setAdding(true)
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: parseInt(newModuleId), title: newTitle.trim() }),
    })
    const lesson = await res.json()
    setLessons(l => [...l, lesson])
    setNewTitle('')
    setAdding(false)
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={selectedCourseId ?? ''}
          onChange={e => router.push(e.target.value ? `/admin/lessons?course=${e.target.value}` : '/admin/lessons')}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search lessons…"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <span className="flex items-center text-xs text-slate-400 font-medium px-2">{filtered.length} lessons</span>
      </div>

      {/* Lesson list */}
      <div className="space-y-2 mb-5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">No lessons found.</div>
        ) : (
          filtered.map(l => <LessonRow key={l.id} lesson={l} />)
        )}
      </div>

      {/* Add lesson (only when a course is selected and modules are available) */}
      {modules && modules.length > 0 && (
        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Add New Lesson</p>
          <div className="flex gap-2">
            <select
              value={newModuleId}
              onChange={e => setNewModuleId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLesson()}
              placeholder="Lesson title…"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              onClick={addLesson}
              disabled={adding || !newTitle.trim() || !newModuleId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-50 shrink-0"
            >
              <Plus size={14} /> {adding ? 'Adding…' : 'Add Lesson'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
