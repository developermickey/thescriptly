'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, X, ExternalLink, Zap, MemoryStick } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  accepted:              'text-emerald-600 bg-emerald-50 border-emerald-200',
  'wrong answer':        'text-red-500    bg-red-50    border-red-200',
  'time limit exceeded': 'text-amber-600  bg-amber-50  border-amber-200',
  'runtime error':       'text-orange-500 bg-orange-50 border-orange-200',
  'compile error':       'text-rose-600   bg-rose-50   border-rose-200',
}
const LANG_COLORS: Record<string, string> = {
  javascript: 'text-yellow-700 bg-yellow-50',
  python:     'text-blue-700   bg-blue-50',
  java:       'text-orange-700 bg-orange-50',
  'c++':      'text-violet-700 bg-violet-50',
}
const DIFF_CLS: Record<string, string> = {
  Easy:   'text-emerald-600',
  Medium: 'text-amber-600',
  Hard:   'text-red-500',
}

interface Sub {
  id: number
  questionId: number
  language: string
  code: string
  status: string
  runtimeMs: number | null
  memoryMb: number | null
  createdAt: string
  question: { id: number; title: string; difficulty: string }
}

export function SubmissionsClient({ submissions }: { submissions: Sub[] }) {
  const [selected, setSelected] = useState<Sub | null>(null)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Problem</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Lang</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Runtime</th>
              <th className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {submissions.map(sub => {
              const statusCls = STATUS_COLORS[sub.status?.toLowerCase()] ?? 'text-slate-600 bg-slate-50 border-slate-200'
              const langCls   = LANG_COLORS[sub.language?.toLowerCase()] ?? 'text-slate-600 bg-slate-50'
              return (
                <tr
                  key={sub.id}
                  onClick={() => setSelected(sub)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800">{sub.question.title}</p>
                    <p className={`text-xs font-bold mt-0.5 ${DIFF_CLS[sub.question.difficulty] ?? 'text-slate-400'}`}>
                      {sub.question.difficulty}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${statusCls}`}>
                      {sub.status === 'accepted' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${langCls}`}>{sub.language}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {sub.runtimeMs != null ? `${sub.runtimeMs}ms` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' '}
                      {new Date(sub.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Code viewer modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fadeIn"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100">
              <div>
                <Link
                  href={`/problems/${selected.questionId}`}
                  className="font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-base"
                  onClick={() => setSelected(null)}
                >
                  {selected.question.title}
                  <ExternalLink size={13} className="text-slate-400" />
                </Link>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[selected.status?.toLowerCase()] ?? ''}`}>
                    {selected.status === 'accepted' ? <CheckCircle size={10} className="inline mr-1" /> : <XCircle size={10} className="inline mr-1" />}
                    {selected.status}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${LANG_COLORS[selected.language?.toLowerCase()] ?? ''}`}>
                    {selected.language}
                  </span>
                  {selected.runtimeMs != null && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Zap size={10} className="text-amber-500" /> {selected.runtimeMs}ms
                    </span>
                  )}
                  {selected.memoryMb != null && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MemoryStick size={10} className="text-blue-400" /> {selected.memoryMb}MB
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 p-1 shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Code */}
            <div className="flex-1 overflow-auto">
              <pre className="p-5 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                {selected.code}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
