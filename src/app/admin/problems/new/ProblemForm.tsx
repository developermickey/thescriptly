'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Trash2, ChevronDown, ChevronUp, Plus, X, GripVertical } from 'lucide-react'

interface Problem {
  id: number
  title: string
  difficulty: string
  topic: string | null
  company: string | null
  problemStatement: string | null
  examples: string | null
  constraints: string | null
  hints: string | null
  solutionExplanation: string | null
  starterCodeJs: string | null
  starterCodePython: string | null
  starterCodeJava: string | null
  starterCodeCpp: string | null
  timeComplexity: string | null
  spaceComplexity: string | null
}

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
const textareaCls = `${inputCls} resize-none font-mono text-xs leading-relaxed`

const Section = ({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        {title}
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  )
}

export function ProblemForm({ problem }: { problem: Problem | null }) {
  const router = useRouter()
  const [saving, setSaving]   = useState(false)
  const [deleting, setDel]    = useState(false)
  const [msg, setMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [fields, setFields] = useState({
    title:               problem?.title ?? '',
    difficulty:          problem?.difficulty ?? 'Medium',
    topic:               problem?.topic ?? '',
    company:             problem?.company ?? '',
    problemStatement:    problem?.problemStatement ?? '',
    examples:            problem?.examples ?? '',
    constraints:         problem?.constraints ?? '',
    hints:               problem?.hints ?? '',
    solutionExplanation: problem?.solutionExplanation ?? '',
    starterCodeJs:       problem?.starterCodeJs ?? '',
    starterCodePython:   problem?.starterCodePython ?? '',
    starterCodeJava:     problem?.starterCodeJava ?? '',
    starterCodeCpp:      problem?.starterCodeCpp ?? '',
    timeComplexity:      problem?.timeComplexity ?? '',
    spaceComplexity:     problem?.spaceComplexity ?? '',
  })

  // Structured hints for edit mode
  const [hints, setHints] = useState<{ id: number; body: string; sortOrder: number }[]>([])
  const [hintsLoaded, setHintsLoaded] = useState(false)
  const [hintSaving, setHintSaving] = useState(false)

  useEffect(() => {
    if (!problem?.id) return
    fetch(`/api/problems/${problem.id}/hints`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHints(d.filter(h => h.id > 0)); setHintsLoaded(true) })
  }, [problem?.id])

  async function addHint() {
    if (!problem?.id) return
    setHintSaving(true)
    const res = await fetch(`/api/problems/${problem.id}/hints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'New hint', sortOrder: hints.length }),
    })
    if (res.ok) { const h = await res.json(); setHints(prev => [...prev, h]) }
    setHintSaving(false)
  }

  async function deleteHint(hintId: number) {
    await fetch(`/api/admin/hints/${hintId}`, { method: 'DELETE' })
    setHints(prev => prev.filter(h => h.id !== hintId))
  }

  async function updateHintBody(hintId: number, body: string) {
    setHints(prev => prev.map(h => h.id === hintId ? { ...h, body } : h))
    await fetch(`/api/admin/hints/${hintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFields(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const payload = {
      ...(problem ? { id: problem.id } : {}),
      ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v || null])),
      title: fields.title,
      difficulty: fields.difficulty,
    }
    const res  = await fetch('/api/admin/problems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ type: 'success', text: problem ? 'Problem updated!' : 'Problem created!' })
      if (!problem) setTimeout(() => router.push('/admin/problems'), 1000)
    } else {
      setMsg({ type: 'error', text: data.error ?? 'Something went wrong.' })
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!problem || !confirm('Delete this problem? This cannot be undone.')) return
    setDel(true)
    await fetch('/api/admin/problems', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: problem.id }),
    })
    router.push('/admin/problems')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Basic Info">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Title *</label>
            <input value={fields.title} onChange={set('title')} required placeholder="Two Sum" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Difficulty *</label>
            <select value={fields.difficulty} onChange={set('difficulty')} className={inputCls}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Topic</label>
            <input value={fields.topic} onChange={set('topic')} placeholder="Arrays, Dynamic Programming…" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Company</label>
            <input value={fields.company} onChange={set('company')} placeholder="Google, Amazon…" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Time Complexity</label>
            <input value={fields.timeComplexity} onChange={set('timeComplexity')} placeholder="O(n)" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Space Complexity</label>
            <input value={fields.spaceComplexity} onChange={set('spaceComplexity')} placeholder="O(1)" className={inputCls} />
          </div>
        </div>
      </Section>

      <Section title="Problem Statement">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
          <textarea value={fields.problemStatement} onChange={set('problemStatement')} rows={8} placeholder="Given an array of integers nums and an integer target…" className={textareaCls} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Examples (one per line, use | to separate input/output)</label>
          <textarea value={fields.examples} onChange={set('examples')} rows={4} placeholder="Input: nums = [2,7,11,15], target = 9 | Output: [0,1]" className={textareaCls} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Constraints</label>
          <textarea value={fields.constraints} onChange={set('constraints')} rows={3} placeholder="2 ≤ nums.length ≤ 10⁴" className={textareaCls} />
        </div>
      </Section>

      <Section title="Hints & Solution" defaultOpen={false}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-600">
              {problem?.id ? 'Structured Hints' : 'Hints (JSON array)'}
            </label>
            {problem?.id && (
              <button type="button" onClick={addHint} disabled={hintSaving}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50">
                <Plus size={12} /> Add Hint
              </button>
            )}
          </div>
          {problem?.id ? (
            hintsLoaded ? (
              hints.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg">
                  No hints yet. Click "Add Hint" to add one.
                </p>
              ) : (
                <div className="space-y-2">
                  {hints.map((h, i) => (
                    <div key={h.id} className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <GripVertical size={14} className="text-slate-300 mt-2 shrink-0" />
                      <span className="text-xs font-bold text-slate-400 mt-2 w-5 shrink-0">#{i + 1}</span>
                      <textarea
                        value={h.body}
                        onChange={e => updateHintBody(h.id, e.target.value)}
                        rows={2}
                        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="button" onClick={() => deleteHint(h.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors mt-1.5 shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : <p className="text-xs text-slate-400">Loading hints…</p>
          ) : (
            <textarea value={fields.hints} onChange={set('hints')} rows={3}
              placeholder='["Try using a hash map", "Store the complement"]' className={textareaCls} />
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Solution Explanation</label>
          <textarea value={fields.solutionExplanation} onChange={set('solutionExplanation')} rows={6} placeholder="Use a hash map to store seen numbers and their indices…" className={textareaCls} />
        </div>
      </Section>

      <Section title="Starter Code" defaultOpen={false}>
        {[
          { key: 'starterCodeJs',     label: 'JavaScript' },
          { key: 'starterCodePython', label: 'Python' },
          { key: 'starterCodeJava',   label: 'Java' },
          { key: 'starterCodeCpp',    label: 'C++' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
            <textarea
              value={(fields as any)[key]}
              onChange={set(key)}
              rows={5}
              placeholder={`// ${label} starter code`}
              className={textareaCls}
            />
          </div>
        ))}
      </Section>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        {problem ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete Problem'}
          </button>
        ) : <div />}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Save size={14} /> {saving ? 'Saving…' : problem ? 'Save Changes' : 'Create Problem'}
        </button>
      </div>
    </form>
  )
}
