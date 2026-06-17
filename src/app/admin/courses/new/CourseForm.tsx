'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Trash2 } from 'lucide-react'

interface Course {
  id: number
  title: string
  description: string | null
  category: string | null
  badge: string | null
  icon: string | null
  isFree: boolean
  price: number | null
  mrp: number | null
  whatYouLearn: string | null
}

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
const textareaCls = `${inputCls} resize-none`

export function CourseForm({ course }: { course: Course | null }) {
  const router = useRouter()
  const [saving,   setSaving]  = useState(false)
  const [deleting, setDel]     = useState(false)
  const [msg, setMsg]          = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [fields, setFields] = useState({
    title:        course?.title        ?? '',
    description:  course?.description  ?? '',
    category:     course?.category     ?? '',
    badge:        course?.badge        ?? '',
    icon:         course?.icon         ?? '',
    isFree:       course?.isFree       ?? true,
    price:        course?.price        != null ? String(course.price) : '',
    mrp:          course?.mrp          != null ? String(course.mrp)   : '',
    whatYouLearn: course?.whatYouLearn ?? '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFields(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    const res  = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(course ? { id: course.id } : {}), ...fields }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ type: 'success', text: course ? 'Course updated!' : 'Course created!' })
      if (!course) setTimeout(() => router.push('/admin/courses'), 1000)
    } else {
      setMsg({ type: 'error', text: data.error ?? 'Something went wrong.' })
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!course || !confirm('Delete this course? All enrollments and progress will be lost.')) return
    setDel(true)
    await fetch('/api/admin/courses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: course.id }),
    })
    router.push('/admin/courses')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-3">Basic Info</h2>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Title *</label>
          <input value={fields.title} onChange={set('title')} required placeholder="Course title" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
          <textarea value={fields.description} onChange={set('description')} rows={3} placeholder="What is this course about?" className={textareaCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Category</label>
            <input value={fields.category} onChange={set('category')} placeholder="e.g. DSA, Web Dev, Python" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Icon (emoji)</label>
            <input value={fields.icon} onChange={set('icon')} placeholder="🐍" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Badge (emoji)</label>
            <input value={fields.badge} onChange={set('badge')} placeholder="🏆" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-3">Pricing</h2>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fields.isFree}
              onChange={e => setFields(f => ({ ...f, isFree: e.target.checked }))}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm font-medium text-slate-700">Free course</span>
          </label>
        </div>

        {!fields.isFree && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Price (₹)</label>
              <input type="number" value={fields.price} onChange={set('price')} placeholder="999" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">MRP (₹)</label>
              <input type="number" value={fields.mrp} onChange={set('mrp')} placeholder="1999" className={inputCls} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-3 mb-4">What You'll Learn</h2>
        <textarea
          value={fields.whatYouLearn}
          onChange={set('whatYouLearn')}
          rows={5}
          placeholder="One bullet point per line, e.g.&#10;Learn the fundamentals of Python&#10;Build real-world projects"
          className={textareaCls}
        />
        <p className="text-xs text-slate-400 mt-1.5">One item per line. Displayed as bullet points on the course page.</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        {course ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete Course'}
          </button>
        ) : <div />}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Save size={14} /> {saving ? 'Saving…' : course ? 'Save Changes' : 'Create Course'}
        </button>
      </div>
    </form>
  )
}
