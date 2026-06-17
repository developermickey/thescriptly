'use client'
import { useState, useRef } from 'react'
import { Upload, FileJson, CheckCircle, AlertCircle, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ImportRow {
  title: string
  difficulty?: string
  topic?: string
  company?: string
  problemStatement?: string
  examples?: string
  constraints?: string
  hints?: string
  solutionExplanation?: string
  starterCodeJs?: string
  starterCodePython?: string
}

interface Result {
  imported: number
  skipped: number
  errors: string[]
}

const SAMPLE_JSON: ImportRow[] = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays',
    company: 'Google',
    problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    examples: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9',
    hints: 'Use a hash map to store the complement of each number.',
    starterCodeJs: 'function twoSum(nums, target) {\n  \n}',
    starterCodePython: 'def twoSum(nums, target):\n    pass',
  },
]

export function ImportClient() {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [rows,    setRows]    = useState<ImportRow[]>([])
  const [error,   setError]   = useState('')
  const [result,  setResult]  = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        let parsed: unknown

        if (file.name.endsWith('.json')) {
          parsed = JSON.parse(text)
        } else if (file.name.endsWith('.csv')) {
          parsed = csvToRows(text)
        } else {
          setError('Only .json and .csv files are supported.')
          return
        }

        if (!Array.isArray(parsed)) {
          setError('File must contain an array of problem objects.')
          return
        }
        setRows(parsed as ImportRow[])
      } catch {
        setError('Failed to parse file. Make sure it is valid JSON or CSV.')
      }
    }
    reader.readAsText(file)
  }

  function csvToRows(csv: string): ImportRow[] {
    const lines  = csv.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) ?? []
      const row: Record<string, string> = {}
      headers.forEach((h, i) => {
        row[h] = (vals[i] ?? '').trim().replace(/^"|"$/g, '')
      })
      return row as unknown as ImportRow
    })
  }

  function downloadSample() {
    const blob = new Blob([JSON.stringify(SAMPLE_JSON, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'codex_problems_sample.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function doImport() {
    if (!rows.length || loading) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res  = await fetch('/api/admin/problems/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Import failed'); return }
      setResult(data)
      setRows([])
      setFileName('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/problems" className="text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk Import Problems</h1>
          <p className="text-slate-500 text-sm mt-1">Upload a JSON or CSV file to import up to 200 problems at once.</p>
        </div>
      </div>

      {/* Download sample */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-bold text-blue-800">Need the format?</p>
          <p className="text-xs text-blue-600 mt-0.5">Download the sample JSON to see all supported fields.</p>
        </div>
        <button
          onClick={downloadSample}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
        >
          <Download size={14} /> Sample JSON
        </button>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
      >
        <input ref={fileRef} type="file" accept=".json,.csv" onChange={handleFile} className="hidden" />
        <div className="w-14 h-14 bg-slate-100 group-hover:bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
          <Upload size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
        </div>
        <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
          {fileName ? fileName : 'Click to upload or drag & drop'}
        </p>
        <p className="text-xs text-slate-400 mt-1">JSON or CSV · max 200 rows</p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800">
              <FileJson size={15} className="inline mr-1.5 text-blue-500" />
              {rows.length} problem{rows.length !== 1 ? 's' : ''} ready to import
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600">#</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600">Title</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600">Difficulty</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600">Topic</th>
                    <th className="px-4 py-2.5 text-left font-bold text-slate-600">Company</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.title || <span className="text-red-400">missing</span>}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          r.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                          r.difficulty === 'Hard' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {r.difficulty || 'Medium'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{r.topic || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.company || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 10 && (
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
                +{rows.length - 10} more rows not shown
              </div>
            )}
          </div>

          <button
            onClick={doImport}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing…</>
              : <><Upload size={15} /> Import {rows.length} Problem{rows.length !== 1 ? 's' : ''}</>}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-6 rounded-xl border px-5 py-4 ${result.errors.length === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className={result.errors.length === 0 ? 'text-emerald-600' : 'text-amber-600'} />
            <p className="font-bold text-sm text-slate-800">Import complete</p>
          </div>
          <p className="text-sm text-slate-700">
            <span className="font-bold text-emerald-700">{result.imported} imported</span>
            {result.skipped > 0 && <span className="ml-2 text-slate-500">· {result.skipped} skipped (duplicates)</span>}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-3 space-y-1">
              {result.errors.map((e, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <AlertCircle size={11} className="shrink-0 mt-0.5" /> {e}
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/problems" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
            View all problems →
          </Link>
        </div>
      )}
    </div>
  )
}
